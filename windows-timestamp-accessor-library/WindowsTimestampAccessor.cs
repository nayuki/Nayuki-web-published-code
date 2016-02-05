/* 
 * Windows timestamp accessor (C#)
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/windows-timestamp-accessor-library
 */

using System;
using System.IO;


public class WindowsTimestampAccessor {
	
	private delegate DateTime GetSomeTimeUtc(string path);
	private delegate void SetSomeTimeUtc(string path, DateTime time);
	
	
	public static int Main(string[] args) {
		if (args.Length != 0) {
			Console.Error.WriteLine("Command-line arguments must be empty");
			return 1;
		}
		
		StreamReader input = new StreamReader(Console.OpenStandardInput(), new System.Text.UTF8Encoding(false, false));
		while (true) {
			try {
				string command = input.ReadLine();
				if (command == null)
					break;  // End of input stream
				string[] tokens = command.Split(new char[]{'\t'});
				if (tokens.Length == 1)
					throw new ArgumentException();
				string action = tokens[0];
				string path = tokens[1];
				
				// Get a timestamp
				if (action.StartsWith("Get") && tokens.Length == 2) {
					GetSomeTimeUtc filefunc = null;
					GetSomeTimeUtc dirfunc = null;
					switch (action) {
						case "GetCreationTime"    :  filefunc = File.GetCreationTimeUtc  ;  dirfunc = Directory.GetCreationTimeUtc  ;  break;
						case "GetModificationTime":  filefunc = File.GetLastWriteTimeUtc ;  dirfunc = Directory.GetLastWriteTimeUtc ;  break;
						case "GetAccessTime"      :  filefunc = File.GetLastAccessTimeUtc;  dirfunc = Directory.GetLastAccessTimeUtc;  break;
						default:  throw new ArgumentException();
					}
					if (File.Exists(path))
						Console.WriteLine("ok\t{0}", filefunc(path).Ticks);
					else if (Directory.Exists(path))
						Console.WriteLine("ok\t{0}", dirfunc(path).Ticks);
					else
						throw new ArgumentException();
				}
				// Set a timestamp
				else if (action.StartsWith("Set") && tokens.Length == 3) {
					SetSomeTimeUtc filefunc = null;
					SetSomeTimeUtc dirfunc = null;
					switch (action) {
						case "SetCreationTime"    :  filefunc = File.SetCreationTimeUtc  ;  dirfunc = Directory.SetCreationTimeUtc  ;  break;
						case "SetModificationTime":  filefunc = File.SetLastWriteTimeUtc ;  dirfunc = Directory.SetLastWriteTimeUtc ;  break;
						case "SetAccessTime"      :  filefunc = File.SetLastAccessTimeUtc;  dirfunc = Directory.SetLastAccessTimeUtc;  break;
						default:  throw new ArgumentException();
					}
					DateTime time = new DateTime(Int64.Parse(tokens[2]));
					if (File.Exists(path)) {
						FileInfo fi = new FileInfo(path);
						bool readOnly = fi.IsReadOnly;
						if (readOnly)
							fi.IsReadOnly = false;
						filefunc(path, time);
						if (readOnly)
							fi.IsReadOnly = true;
						Console.WriteLine("ok");
					} else if (Directory.Exists(path)) {
						dirfunc(path, time);
						Console.WriteLine("ok");
					} else
						throw new ArgumentException();
					
				}
				else
					throw new ArgumentException();
			
			} catch (Exception e) {
				if (       e is ArgumentException
				        || e is FileNotFoundException
				        || e is UnauthorizedAccessException
				        || e is PathTooLongException
				        || e is NotSupportedException
				        || e is IOException
				        || e is ArgumentOutOfRangeException)  // Known exception
					Console.WriteLine("error");
				else  // Unexpected exception
					throw e;
			}
		}
		return 0;
	}
	
}
