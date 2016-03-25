/* 
 * Nayuki's Dropbox backup utility - Uploader service
 * 
 * This program periodically uploads encrypted copies of local files to Dropbox, running in the background.
 * Usage: java DropboxBackupService ConfigFile.json
 * 
 * Program notes:
 * 
 * - A ConfigFile.json file has a format like this:
 *   {
 *     "dropbox-access-token": "r9DhIqHfwLMVYwkctcx2Vi9_UuV6O3pHcwdVYt-gCVf2APyh_Z1xVzSLC7S-TDJp",
 *     "file-encryption-key": "000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F",
 *     "backup-paths": [
 *       {"local":"/var/www/jane-doe", "remote":"/files/www-djane/"},
 *       {"local":"C:\\Users\\John Smith\\My Documents", "remote":"/backup/docs-john-smith/"},
 *       {"local":"D:\\Sales reports", "remote":"/backup/sales-reports/"}
 *     ]
 *   }
 *   Format notes:
 *   - The key must be 64 hexadecimal characters (256 bits), case-insensitive.
 *   - A backslash (\) in a path must be written as double-backslash (\\) due to the JSON format.
 *   - Each remote path must start and end with slash (/).
 *   - Each local path must be a directory, not a file.
 *   - Trailing commas are disallowed in JSON lists.
 * 
 * - This program requires Java SE 7+ and Nayuki's JSON library (https://www.nayuki.io/page/json-library-java).
 *   No other libraries are required. In particular, the cryptography implementation is self-contained.
 * 
 * - The encryption format produced by this program is secure, but also easy to understand and independently reimplement.
 *   
 *   First, each component of the file path (relative to the backup root) is encrypted using the "name encryption algorithm".
 *   For example, "hello" might encrypt to "RVoJ8rD" and "world.txt" might encrypt to "ff3q_lpNLq-x", therefore the path
 *   "/home/alice/to-backup/hello/world.txt" could map to "/dropbox/backup/RVoJ8rD/ff3q_lpNLq-x". Note that this mapping
 *   only depends on the strings and the cipher key, not on anything else (file contents, full path, etc.). Thus a file
 *   that stays at the same location on the local file system will always be mapped to the same location on Dropbox.
 *   
 *   The name encryption algorithm maps Unicode strings (not containing the NUL character) to base64 ASCII strings.
 *   The string is converted to bytes as UTF-8. If the length is less than or equal to an AES block (16 bytes),
 *   then it is padded with zeros and simply encrypted in ECB mode. Otherwise the length is strictly greater than
 *   a block, then it is encrypted with AES-256-CBC with ciphertext stealing mode 3, the bytes are reversed,
 *   then encrypted again with the same algorithm. The encrypted bytes are encoded using base64url (RFC 4648)
 *   without padding. If only one pass of CBC mode encryption were used, then a bunch of strings with the same
 *   long prefix would show patterns in the ciphertext due to the lack of IV. But thanks to the reversal and
 *   second encryption, these patterns are fully obfuscated.
 *   
 *   Second, the contents of each file is encrypted using AES-256 with PKCS #7 padding, CBC mode, a random IV
 *   (per encryption attempt, so the encrypted data changes on each run even if the original file stays the same),
 *   and an HMAC-SHA-256 (covering the IV, data, and padding). Note that the MAC uses the same cipher key,
 *   and uses "encrypt-then-MAC" mode.
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/encrypted-backup-client-for-dropbox
 */

package io.nayuki.dropboxbackup;

import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import io.nayuki.json.Json;


public final class DropboxBackupService {
	
	/*---- Main application ----*/
	
	private static byte[] cipherKey;
	
	private static String accessToken;
	
	private static Map<File,FileInfo> knownFiles;
	
	
	public static void main(String[] args) throws IOException, InterruptedException {
		String errMsg = subMain(args);
		if (errMsg != null) {
			System.err.println(errMsg);
			System.exit(1);
		}
	}		
	
	
	private static String subMain(String[] args) throws IOException, InterruptedException {
		// Check command line arguments
		if (args.length != 1)
			return "Usage: java MyDropboxBackuper ConfigFile.json";
		File configFile = new File(args[0]);
		if (!configFile.isFile())
			return "Error: Configuration file not found";
		
		// Load configuration file data
		Object config = Json.parseFromFile(new File(args[0]));
		accessToken = Json.getString(config, "dropbox-access-token");
		cipherKey = Utils.hexToBytes(Json.getString(config, "file-encryption-key"));
		
		// Check each backup path
		Collection<String[]> backupPaths = new ArrayList<>();
		for (Object bp : Json.getList(config, "backup-paths")) {
			File srcDir = new File(Json.getString(bp, "local"));
			String destPath = Json.getString(bp, "remote");
			if (!srcDir.isDirectory())
				throw new IllegalArgumentException("Local path must be a directory");
			if (!destPath.startsWith("/") || !destPath.endsWith("/"))
				throw new IllegalArgumentException("Remote path must start and end with '/'");
			backupPaths.add(new String[]{srcDir.getPath(), destPath});
		}
		
		// Periodically check and upload files
		knownFiles = new HashMap<>();
		while (true) {
			for (String[] bp : backupPaths)
				processBackup(new File(bp[0]), bp[1], true);
			Thread.sleep(3600000);  // 1 hour
		}
	}
	
	
	// Uploads an encrypted copy of the given local file to the given Dropbox path,
	// or iterates over the given local directory and recurses on all its items.
	private static void processBackup(File srcItem, String destPath, boolean isRoot) throws IOException, OutOfMemoryError {
		if (srcItem.isDirectory()) {
			if (!isRoot)
				destPath += "/";
			for (File subItem : srcItem.listFiles())
				processBackup(subItem, destPath + encryptFileName(subItem.getName()), false);
			
		} else if (srcItem.isFile()) {
			// Check file info in memory cache
			long len = srcItem.length();
			FileInfo info = knownFiles.get(srcItem);
			if (info != null && info.length == len && info.modTime == srcItem.lastModified())
				return;  // File seems unchanged, so skip it
			if (info == null) {
				info = new FileInfo();
				knownFiles.put(srcItem, info);
			}
			info.length = len;
			info.modTime = srcItem.lastModified();
			
			// Read entire file and encrypt
			if (len > 1000000000)
				throw new IllegalArgumentException("File too large");
			byte[] b = new byte[(int)len];
			try (DataInputStream in = new DataInputStream(new FileInputStream(srcItem))) {
				in.readFully(b);
			}
			b = encryptFileData(b);
			knownFiles.put(srcItem, info);
			
			// Upload file to Dropbox
			System.err.printf("[%s] Uploading file: %s  -->  %s%n", new Date(), srcItem, destPath);
			uploadFile(b, destPath);
		}
	}
	
	
	// Please ensure that the data array is already encrypted!
	private static void uploadFile(byte[] data, String path) throws IOException {
		if (!path.startsWith("/"))
			throw new IllegalArgumentException("Path must start with slash");
		if (path.contains("&") || path.contains("?"))
			throw new IllegalArgumentException("Path contains forbidden characters");
		URL url = new URL("https://content.dropboxapi.com/1/files_put/auto" + path + "?overwrite=true&access_token=" + accessToken);
		HttpURLConnection con = (HttpURLConnection)url.openConnection();
		con.setRequestMethod("PUT");
		con.setRequestProperty("Content-Length", Integer.toString(data.length));
		con.setDoOutput(true);
		con.setFixedLengthStreamingMode(data.length);
		con.connect();
		try (OutputStream out = con.getOutputStream()) {
			out.write(data);
		}
		try (InputStream in = con.getInputStream()) {
			while (in.read() != -1);
		}
	}
	
	
	/*---- Encryption functions ----*/
	
	// Encrypts the given string using the cipher key and returns a base64-encoded ASCII string.
	// The encryption is deterministic and only depends on the string, cipher key, and cipher algorithm.
	// The input string must not contain the NUL character.
	private static String encryptFileName(String s) {
		if (s.contains("\0"))
			throw new IllegalArgumentException("File name must not contain NUL character");
		byte[] b = s.getBytes(StandardCharsets.UTF_8);
		Aes ciph = new Aes(cipherKey);
		if (b.length <= Aes.BLOCK_LENGTH) {  // Single block
			// Pad with zeros, then encrypt in ECB mode
			b = Arrays.copyOf(b, Aes.BLOCK_LENGTH);
			ciph.encryptBlock(b, 0);
		} else {  // Multi-block
			encryptCbcCts3(b);
			Utils.reverseArray(b);
			encryptCbcCts3(b);
		}
		Base64.Encoder b64enc = Base64.getUrlEncoder().withoutPadding();
		return b64enc.encodeToString(b);
	}
	
	
	// Encrypts the given binary data using the CBC (ciphertext block chaining) mode
	// with no IV (initialization vector) and using CTS (ciphertext stealing) type 3.
	private static void encryptCbcCts3(byte[] b) {
		int blockLen = Aes.BLOCK_LENGTH;
		if (b.length <= blockLen)
			throw new IllegalArgumentException("Data must be longer than one block");
		Aes ciph = new Aes(cipherKey);
		
		// Encrypt head block using ECB
		ciph.encryptBlock(b, 0);
		
		// Encrypt subsequent blocks except the last one using CBC
		int i;
		for (i = blockLen; i + blockLen < b.length; i += blockLen) {
			for (int j = 0; j < blockLen; j++)
				b[i + j] ^= b[i - blockLen + j];
			ciph.encryptBlock(b, i);
		}
		
		// CBC last block, swap prefixes of last two blocks, encrypt new second-last block
		for (int j = i; j < b.length; j++) {
			byte temp = b[j - blockLen];
			b[j - blockLen] ^= b[j];
			b[j] = temp;
		}
		ciph.encryptBlock(b, i - blockLen);
	}
	
	
	// Encrypts the file data with randomization and authentication. The algorithm pads the data
	// using PKCS #7 (RFC 5652), prepends a randomly generated initialization vector, encrypts the
	// whole data using AES-256-CBC, and appends an HMAC-SHA-256 of the encrypted data.
	private static byte[] encryptFileData(byte[] data) {
		// Calculate offsets/lengths and make final-sized array (with space for IV, message, padding, HMAC)
		int blockLen = Aes.BLOCK_LENGTH;
		int paddedLen = (data.length / blockLen + 1) * blockLen;  // Without IV
		int hashOffset = paddedLen + blockLen;  // Where the MAC starts
		byte[] result = new byte[hashOffset + Sha256.HASH_LENGTH];
		System.arraycopy(data, 0, result, blockLen, data.length);
		
		// Apply padding for cipher
		int padding = paddedLen - data.length;
		if (padding < 1 || padding > blockLen)
			throw new AssertionError();
		for (int i = 0; i < padding; i++)
			result[hashOffset - 1 - i] = (byte)padding;
		
		// Generate random initialization vector
		byte[] initVec = new byte[blockLen];
		new SecureRandom().nextBytes(initVec);
		System.arraycopy(initVec, 0, result, 0, blockLen);
		
		// Encrypt data in CBC mode, processing blocks in forward order
		Aes ciph = new Aes(cipherKey);
		for (int i = blockLen; i < hashOffset; i += blockLen) {
			for (int j = 0; j < blockLen; j++)
				result[i + j] ^= result[i - blockLen + j];
			ciph.encryptBlock(result, i);
		}
		
		// Compute and append MAC
		byte[] hash = Sha256.getHmac(cipherKey, Arrays.copyOf(result, hashOffset));
		System.arraycopy(hash, 0, result, hashOffset, hash.length);
		return result;
	}
	
	
	
	private static final class FileInfo {
		
		public long length;
		public long modTime;
		
	}
	
}
