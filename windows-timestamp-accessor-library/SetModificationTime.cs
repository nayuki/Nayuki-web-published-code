/* 
 * Set modification time (C#)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/windows-timestamp-accessor-library
 */

using System;
using System.IO;


public sealed class SetCreationTime {
	
	public static int Main(string[] args) {
		if (args.Length != 2) {
			Console.Error.WriteLine("Usage: SetModificationTime FileOrDir Ticks");
			return 1;
		}
		string path = args[0];
		if (!File.Exists(path) && !Directory.Exists(path)) {
			Console.Error.WriteLine("Error: Path does not exist");
			return 1;
		}
		long ticks = long.Parse(args[1]);
		
		var fi = new FileInfo(path);
		bool readOnly = fi.IsReadOnly;
		if (readOnly)
			fi.IsReadOnly = false;
		Directory.SetLastWriteTimeUtc(path, new DateTime(ticks, DateTimeKind.Utc));
		if (readOnly)
			fi.IsReadOnly = true;
		return 0;
	}
	
}
