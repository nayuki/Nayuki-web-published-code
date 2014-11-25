/* 
 * Fast DEFLATE implementation
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/simple-deflate-implementation
 */

import java.io.EOFException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;
import java.util.zip.DataFormatException;


public final class gunzip {
	
	public static void main(String[] args) {
		String msg = submain(args);
		if (msg != null) {
			System.err.println(msg);
			System.exit(1);
		}
	}
	
	
	private static String submain(String[] args) {
		// Check arguments
		if (args.length != 2)
			return "Usage: java gunzip InputFile.gz OutputFile";
		
		File inFile = new File(args[0]);
		if (!inFile.exists())
			return "Input file does not exist: " + inFile;
		if (inFile.isDirectory())
			return "Input file is a directory: " + inFile;
		
		try {
			// Start reading
			InputStream in = new MarkableFileInputStream(inFile);
			Inflater inf;
			int crc, size;
			try {
				// Header
				int flags;
				{
					byte[] b = new byte[10];
					readFully(in, b);
					if (b[0] != 0x1F || b[1] != (byte)0x8B)
						return "Invalid GZIP magic number";
					if (b[2] != 8)
						return "Unsupported compression method: " + (b[2] & 0xFF);
					flags = b[3] & 0xFF;
					
					// Reserved flags
					if ((flags & 0xE0) != 0)
						return "Reserved flags are set";
					
					// Modification time
					int mtime = (b[4] & 0xFF) | (b[5] & 0xFF) << 8 | (b[6] & 0xFF) << 16 | b[7] << 24;
					if (mtime != 0)
						System.err.println("Last modified: " + new Date(mtime * 1000L));
					else
						System.err.println("Last modified: N/A");
					
					// Extra flags
					switch (b[8] & 0xFF) {
						case 2:   System.err.println("Extra flags: Maximum compression");  break;
						case 4:   System.err.println("Extra flags: Fastest compression");  break;
						default:  System.err.println("Extra flags: Unknown (" + (b[8] & 0xFF) + ")");  break;
					}
					
					// Operating system
					String os;
					switch (b[9] & 0xFF) {
						case   0:  os = "FAT";             break;
						case   1:  os = "Amiga";           break;
						case   2:  os = "VMS";             break;
						case   3:  os = "Unix";            break;
						case   4:  os = "VM/CMS";          break;
						case   5:  os = "Atari TOS";       break;
						case   6:  os = "HPFS";            break;
						case   7:  os = "Macintosh";       break;
						case   8:  os = "Z-System";        break;
						case   9:  os = "CP/M";            break;
						case  10:  os = "TOPS-20";         break;
						case  11:  os = "NTFS";            break;
						case  12:  os = "QDOS";            break;
						case  13:  os = "Acorn RISCOS";    break;
						case 255:  os = "Unknown";         break;
						default :  os = "Really unknown";  break;
					}
					System.err.println("Operating system: " + os);
				}
				
				// Handle assorted flags
				if ((flags & 0x01) != 0)
					System.err.println("Flag: Text");
				if ((flags & 0x04) != 0) {
					System.err.println("Flag: Extra");
					byte[] b = new byte[2];
					readFully(in, b);
					int len = (b[0] & 0xFF) | (b[1] & 0xFF) << 8;
					readFully(in, new byte[len]);  // Skip extra data
				}
				if ((flags & 0x08) != 0)
					System.err.println("File name: " + readNullTerminatedString(in));
				if ((flags & 0x02) != 0) {
					byte[] b = new byte[2];
					readFully(in, b);
					System.err.printf("Header CRC-16: %04X%n", (b[0] & 0xFF) | (b[1] & 0xFF) << 8);
				}
				if ((flags & 0x10) != 0)
					System.err.println("Comment: " + readNullTerminatedString(in));
				
				// Decompress and write to output file
				File outFile = new File(args[1]);
				OutputStream out = new FileOutputStream(outFile);
				long elapsedTime;
				try {
					long startTime = System.nanoTime();
					inf = new Inflater(in, out);
					elapsedTime = System.nanoTime() - startTime;
				} catch (DataFormatException e) {
					return "Invalid or corrupt compressed data: " + e.getMessage();
				} finally {
					out.close();
				}
				System.err.printf("Input  speed: %.2f MiB/s%n",  inFile.length() / 1048576.0 / elapsedTime * 1.0e9);
				System.err.printf("Output speed: %.2f MiB/s%n", outFile.length() / 1048576.0 / elapsedTime * 1.0e9);
				
				// Footer
				{
					byte[] b = new byte[8];
					readFully(in, b);
					crc  = (b[0] & 0xFF) | (b[1] & 0xFF) << 8 | (b[2] & 0xFF) << 16 | b[3] << 24;
					size = (b[4] & 0xFF) | (b[5] & 0xFF) << 8 | (b[6] & 0xFF) << 16 | b[7] << 24;
				}
			} finally {
				in.close();
			}
			
			// Check
			if (size != (int)inf.getLength())
				return "Decompressed size mismatch";
			if (crc != inf.getCrc32())
				return "Decompression CRC-32 mismatch";
			
		} catch (IOException e) {
			return "I/O exception: " + e.getMessage();
		}
		
		return null;
	}
	
	
	private static String readNullTerminatedString(InputStream in) throws IOException {
		StringBuilder sb = new StringBuilder();
		while (true) {
			int b = in.read();
			if (b == -1)
				throw new EOFException();
			else if (b == 0)
				break;
			else
				sb.append((char)(b & 0xFF));
		}
		return sb.toString();
	}
	
	
	private static void readFully(InputStream in, byte[] b) throws IOException {
		int off = 0;
		while (off < b.length) {
			int n = in.read(b, off, b.length - off);
			if (n == -1)
				throw new EOFException();
			off += n;
		}
	}
	
}
