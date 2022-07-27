/* 
 * Get timestamps (C#)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/windows-timestamp-accessor-library
 */

using System;
using System.IO;


public sealed class GetTimestamps {
	
	public static int Main(string[] args) {
		if (args.Length != 1) {
			Console.Error.WriteLine("Usage: GetTimestamps FileOrDir");
			return 1;
		}
		string path = args[0];
		if (!File.Exists(path) && !Directory.Exists(path)) {
			Console.Error.WriteLine("Error: Path does not exist");
			return 1;
		}
		
		DateTime[] times = {
			Directory.GetCreationTimeUtc(path),
			Directory.GetLastWriteTimeUtc(path),
			Directory.GetLastAccessTimeUtc(path),
		};
		string[] fields = {
			"Creation",
			"Modification",
			"Access",
		};
		for (int i = 0; i < fields.Length; i++) {
			Console.Out.WriteLine(fields[i]);
			DateTime time = times[i];
			Console.Out.WriteLine("\tDatetime: {0}", time);
			Console.Out.WriteLine("\tTicks: {0}", time.Ticks);
			long temp = (time - UnixEpoch).Ticks;
			string sign = temp >= 0 ? "" : "-";
			temp = Math.Abs(temp);
			Console.Out.WriteLine("\tUnix: {0}{1}.{2:0000000}", sign, temp / 10000000, temp % 10000000);
		}
		
		return 0;
	}
	
	
	private static readonly DateTime UnixEpoch = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
	
}
