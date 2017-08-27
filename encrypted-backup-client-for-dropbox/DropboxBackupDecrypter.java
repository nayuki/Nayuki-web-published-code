/* 
 * Nayuki's Dropbox backup utility - Local decrypter
 * 
 * This program takes an encrypted input directory and decrypts its entire file tree to an empty output directory.
 * Usage: java DropboxBackupDecrypter ConfigFile.json InputEncryptedDir OutputDecryptedDir
 * 
 * Program notes:
 * 
 * - InputEncryptedDir is a local tree of files and directories in the format that was produced by the
 *   corresponding backup uploader program. You can obtain this file tree by either using the Dropbox
 *   desktop sync app, or by logging in to their web site, downloading a ZIP file of your encrypted
 *   backup directory, and unzipping it to a local directory.
 * 
 * - OutputDecryptedDir is a local directory that exists, and must be empty.
 * 
 * - ConfigFile.json is the same configuration file used by the backup uploader program.
 *   However, the only field used is "file-encryption-key"; all other data is ignored.
 * 
 * - This program requires Java SE 7+ and Nayuki's JSON library (https://www.nayuki.io/page/json-library-java).
 *   No other libraries are required. In particular, the cryptography implementation is self-contained.
 * 
 * - When run, this program prints a status message to standard error for each file/directory processed.
 *   This is useful for checking which files (if any) failed to decrypt properly.
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/encrypted-backup-client-for-dropbox
 */

package io.nayuki.dropboxbackup;

import java.io.DataInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import io.nayuki.json.Json;


public final class DropboxBackupDecrypter {
	
	/*---- Main application ----*/
	
	private static byte[] cipherKey;
	private static boolean hasError;
	
	
	public static void main(String[] args) throws IOException {
		String errMsg = subMain(args);
		if (errMsg != null) {
			System.err.println(errMsg);
			System.exit(1);
		}
	}
	
	
	private static String subMain(String[] args) throws IOException {
		// Check file/directory arguments
		if (args.length != 3)
			return "Usage: java MyDropboxBackuper ConfigFile.json InputEncryptedDir OutputDecryptedDir";
		File configFile = new File(args[0]);
		File srcDir     = new File(args[1]);
		File destDir    = new File(args[2]);
		if (!configFile.isFile())
			return "Error: Configuration file not found";
		if (!srcDir.isDirectory())
			return "Error: Input path is not an existing directory";
		if (!destDir.isDirectory() || destDir.list().length != 0)
			return "Error: Output path is not an existing empty directory";
		
		// Load configuration file data
		Object config = Json.parseFromFile(configFile);
		cipherKey = Utils.hexToBytes(Json.getString(config, "file-encryption-key"));
		if (cipherKey.length != Aes.KEY_LENGTH)
			return "Error: Invalid AES-256 key length";
		
		// Process files and directories
		hasError = false;
		processDecryption(srcDir, destDir, true);
		System.err.println();
		
		// Finish by printing summary status
		if (hasError)
			return "Finished with one or more errors";
		System.err.println("Finished successfully");
		return null;
	}
	
	
	// Decrypts the given source item (file/directory) to the given
	// destination path (which must not already exist, except for the root).
	private static void processDecryption(File srcItem, File destItem, boolean isRoot) throws IOException, OutOfMemoryError {
		if (!isRoot && destItem.exists())
			throw new RuntimeException("Unexpected destination item");
		
		if (srcItem.isDirectory()) {
			if (!isRoot) {
				if (destItem.mkdir())
					System.err.printf("Created directory: %s%n", destItem);
				else {
					System.err.printf("Failed to make output directory: %s%n", destItem);
					hasError = true;
					return;
				}
			}
			for (File subItem : srcItem.listFiles()) {
				String name = subItem.getName();
				try {
					name = decryptFileName(name);
				} catch (IllegalArgumentException e) {
					System.err.printf("Failed to decrypt item name: %s%n", subItem);
					hasError = true;
					continue;
				}
				processDecryption(subItem, new File(destItem, name), false);
			}
			
		} else if (srcItem.isFile()) {
			// Read input file
			long len = srcItem.length();
			if (len > 1000000000) {
				System.err.printf("File too large: %s%n", srcItem);
				hasError = true;
				return;
			}
			byte[] b = new byte[(int)len];
			try (DataInputStream in = new DataInputStream(new FileInputStream(srcItem))) {
				in.readFully(b);
			} catch (IOException e) {
				System.err.printf("I/O exception when reading file: %s%n", srcItem);
				hasError = true;
				return;
			}
			// Decrypt data
			try {
				b = decryptFileData(b);
			} catch (IllegalArgumentException e) {
				System.err.printf("%s: %s%n", e.getMessage(), srcItem);
				hasError = true;
				return;
			}
			// Write output file
			try (OutputStream out = new FileOutputStream(destItem)) {
				out.write(b);
			} catch (IOException e) {
				System.err.printf("I/O exception when writinging file: %s%n", destItem);
				hasError = true;
				return;
			}
			System.err.printf("Decrypted file: %s%n", destItem);
			
		} else {
			System.err.printf("Skipped unknown file item: %s%n", srcItem);
		}
	}
	
	
	/*---- Decryption functions ----*/
	
	// Decrypts the given base64 string as a file name using the cipher key.
	// Throws an IllegalArgumentException if decryption failed.
	private static String decryptFileName(String s) {
		byte[] b = Base64.getUrlDecoder().decode(s);
		Aes ciph = new Aes(cipherKey);
		if (b.length < Aes.BLOCK_LENGTH)
			throw new IllegalArgumentException("Invalid encrypted data length");
		else if (b.length == Aes.BLOCK_LENGTH) {  // Single block
			// Decrypt in ECB mode, then strip trailing zeros
			ciph.decryptBlock(b, 0);
			int len = b.length;
			while (len > 0 && b[len - 1] == 0)
				len--;
			b = Arrays.copyOf(b, len);
		} else {  // Multi-block
			decryptCbcCts3(b);
			Utils.reverseArray(b);
			decryptCbcCts3(b);
		}
		if (!Utils.isValidUtf8(b))
			throw new IllegalArgumentException("Invalid decrypted data");
		return new String(b, StandardCharsets.UTF_8);
	}
	
	
	// Decrypts the given binary data in place using AES-256-CBC with CTS mode 3.
	// Requires the data to be strictly greater than 1 block long, and always succeeds.
	private static void decryptCbcCts3(byte[] b) {
		final int blockLen = Aes.BLOCK_LENGTH;
		if (b.length <= blockLen)
			throw new IllegalArgumentException("Data must be longer than one block");
		Aes ciph = new Aes(cipherKey);
		
		// Decrypt second-last ciphertext block
		int i = ((b.length - 1) / blockLen - 1) * blockLen;
		ciph.decryptBlock(b, i);
		
		// Swap prefixes of last two ciphertext blocks, un-CBC last block
		for (int j = i + blockLen; j < b.length; j++) {
			byte temp = b[j];
			b[j] ^= b[j - blockLen];
			b[j - blockLen] = temp;
		}
		
		// Decrypt preceding blocks in CBC or ECB mode, processing in reverse order
		for (; i >= 0; i -= blockLen) {
			ciph.decryptBlock(b, i);
			if (i >= blockLen) {
				for (int j = 0; j < blockLen; j++)
					b[i + j] ^= b[i - blockLen + j];
			}
		}
	}
	
	
	// Tries to decrypt the file data in the given array, returning a new array with the bare data.
	// This function throws an IllegalArgumentException if the MAC or padding is incorrect.
	// Note that to save memory, the input array is clobbered by this function.
	private static byte[] decryptFileData(byte[] data) {
		final int blockLen = Aes.BLOCK_LENGTH;
		int hashOffset = data.length - Sha256.HASH_LENGTH;  // Where the MAC starts
		int paddedLen = hashOffset - blockLen;  // Minus the IV
		if (paddedLen <= 0 || paddedLen % blockLen != 0)
			throw new IllegalArgumentException("Invalid encrypted data length");
		
		// Check the message authentication code
		byte[] hash = Sha256.getHmac(cipherKey, Arrays.copyOf(data, hashOffset));
		int diff = 0;
		for (int i = 0; i < hash.length; i++)
			diff |= hash[i] ^ data[hashOffset + i];
		if (diff != 0)
			throw new IllegalArgumentException("Integrity check failed");
		
		// Decrypt data in CBC mode, processing blocks in reverse order
		Aes ciph = new Aes(cipherKey);
		for (int i = hashOffset - blockLen; i >= blockLen; i -= blockLen) {
			ciph.decryptBlock(data, i);
			for (int j = 0; j < blockLen; j++)
				data[i + j] ^= data[i - blockLen + j];
		}
		
		// Process padding
		int padding = data[hashOffset - 1];  // Signed int8
		if (padding < 1 || padding > 16)
			throw new IllegalArgumentException("Invalid decrypted data padding");
		for (int i = 0; i < padding; i++) {
			if (data[hashOffset - 1 - i] != padding)
				throw new IllegalArgumentException("Invalid decrypted data padding");
		}
		return Arrays.copyOfRange(data, blockLen, hashOffset - padding);
	}
	
}
