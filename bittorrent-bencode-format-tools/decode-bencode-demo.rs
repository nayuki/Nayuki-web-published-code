/* 
 * BitTorrent bencode decoder demo (Rust)
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/bittorrent-bencode-format-tools
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

mod bencode;
use bencode::Bencode;


// Reads the given file, parses its data as bencode, then prints the
// data structure with hierarchical formatting to standard output.
fn main() -> std::io::Result<()> {
	let argv: Vec<String> = std::env::args().collect();
	if argv.len() != 2 {
		eprintln!("Usage: {} Input.torrent", argv[0]);
		std::process::exit(1);
	}
	let file = std::path::Path::new(&argv[1]);
	if !file.is_file() {
		eprintln!("Usage: {} Input.torrent", argv[0]);
		std::process::exit(1);
	}
	
	let mut inp: std::fs::File = std::fs::OpenOptions::new().read(true).open(file)?;
	let obj: Bencode = Bencode::parse(&mut inp)?;
	print_bencode_value(&obj, 0);
	Ok(())
}


// Recursively prints the given value/structure to standard output,
// with at least the given indentation depth.
fn print_bencode_value(obj: &Bencode, depth: u32) {
	match obj {
		Bencode::Int(val) => {
			println!("Integer: {}", val);
		},
		
		Bencode::Bytes(ref bytes) => {
			print!("Byte string ({}) ", bytes.len());
			match std::str::from_utf8(bytes) {
				Ok(s) => println!("(text): {}", s),
				Err(_) => {
					print!("(binary): ");
					for (i, b) in bytes.iter().enumerate() {
						print!("{:02X}", b);
						if i + 1 < bytes.len() {
							print!(" ");
							if i == 30 {
								print!("...");
								break;
							}
						}
					}
					println!();
				},
			}
		},
		
		Bencode::List(ref list) => {
			println!("List:");
			for (i, item) in list.iter().enumerate() {
				print_indent(depth + 1);
				print!("{} = ", i);
				print_bencode_value(item, depth + 1);
			}
		},
		
		Bencode::Dict(ref dict) => {
			println!("Dictionary:");
			for (key, item) in dict {
				print_indent(depth + 1);
				match std::str::from_utf8(key) {
					Ok(s) => print!("{}", s),
					Err(_) => {
						for (i, b) in key.iter().enumerate() {
							if i > 0 {
								print!(" ");
							}
							print!("{:02X}", b);
						}
					}
				}
				print!(" = ");
				print_bencode_value(item, depth + 1);
			}
		},
	}
}


// Prints the given multiple of indentation whitespace
// to standard output, without a trailing newline.
fn print_indent(depth: u32) {
	for _ in 0 .. depth {
		print!("    ");
	}
}
