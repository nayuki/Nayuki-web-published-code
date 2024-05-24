/* 
 * CRC-32 forcer (Rust)
 * 
 * Copyright (c) 2024 Project Nayuki
 * https://www.nayuki.io/page/forcing-a-files-crc-to-any-value
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program (see COPYING.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

use std::io;
use io::Read;
use io::Seek;
use io::Write;
use std::str::FromStr;


/*---- Main application ----*/

fn main() {
	if let Some(msg) = submain(std::env::args().collect()) {
		eprintln!("{}", msg);
		std::process::exit(1);
	}
}


fn submain(argv: Vec<String>) -> Option<String> {
	// Handle arguments
	if argv.len() != 4 {
		return Some(format!("Usage: {} FileName ByteOffset NewCrc32Value", argv[0]));
	}
	let offset = match u64::from_str(&argv[2]) {
		Ok(x) => x,
		Err(_) => return Some("Error: Invalid byte offset".to_string()),
	};
	if argv[3].len() != 8 {
		return Some("Error: Invalid new CRC-32 value".to_string());
	}
	let newcrc = match u32::from_str_radix(&argv[3], 16) {
		Ok(x) => x.reverse_bits(),
		Err(_) => return Some("Error: Invalid new CRC-32 value".to_string()),
	};
	
	let file = std::path::Path::new(&argv[1]);
	if !file.is_file() {
		return Some(format!("Error: File does not exist: {}", argv[1]));
	}
	
	// Process the file
	match modify_file_crc32(&file, offset, newcrc, true) {
		Ok(_) => None,
		Err(e) => {
			let prefix = if e.kind() == io::ErrorKind::InvalidInput
				{ "Error" } else { "I/O error" };
			Some(format!("{}: {}", prefix, e.to_string()))
		}
	}
}


/*---- Main function ----*/

// Public library function.
pub fn modify_file_crc32(file: &std::path::Path, offset: u64, newcrc: u32, printstatus: bool)
		-> io::Result<()> {
	
	let length: u64 = std::fs::metadata(file)?.len();
	let mut raf = std::fs::OpenOptions::new().read(true).write(true).open(file)?;
	if length < 4 || offset > length - 4 {
		return Err(io::Error::new(
			io::ErrorKind::InvalidInput, "Byte offset plus 4 exceeds file length"));
	}
	
	// Read entire file and calculate original CRC-32 value
	let crc: u32 = get_crc32(&mut raf)?;
	if printstatus {
		println!("Original CRC-32: {:08X}", crc.reverse_bits());
	}
	
	// Compute the change to make
	let delta = multiply_mod(
		reciprocal_mod(pow_mod(2, (length - offset) * 8)),
		u64::from(crc ^ newcrc)) as u32;
	
	// Patch 4 bytes in the file
	raf.seek(io::SeekFrom::Start(offset))?;
	let mut bytes4 = [0u8; 4];
	raf.read_exact(&mut bytes4)?;
	for (i, b) in bytes4.iter_mut().enumerate() {
		*b ^= (delta.reverse_bits() >> (i * 8)) as u8;
	}
	raf.seek(io::SeekFrom::Start(offset))?;
	raf.write_all(&bytes4)?;
	if printstatus {
		println!("Computed and wrote patch");
	}
	
	// Recheck entire file
	assert_eq!(get_crc32(&mut raf)?, newcrc, "Failed to update CRC-32 to desired value");
	if printstatus {
		println!("New CRC-32 successfully verified");
	}
	Ok(())
}


/*---- Utilities ----*/

// Generator polynomial. Do not modify, because there are many dependencies
const POLYNOMIAL: u64 = 0x104C11DB7;


fn get_crc32(raf: &mut std::fs::File) -> io::Result<u32> {
	raf.seek(io::SeekFrom::Start(0))?;
	let mut crc: u32 = !0;
	let mut buffer = [0u8; 32 * 1024];
	loop {
		let n: usize = raf.read(&mut buffer)?;
		if n == 0 {
			return Ok(!crc);
		}
		for b in &buffer[.. n] {
			for i in 0 .. 8 {
				crc ^= u32::from(*b >> i) << 31;
				crc = (crc << 1) ^ ((crc >> 31) * (POLYNOMIAL as u32));
			}
		}
	}
}


/*---- Polynomial arithmetic ----*/

// Returns polynomial x multiplied by polynomial y modulo the generator polynomial.
fn multiply_mod(mut x: u64, mut y: u64) -> u64 {
	let degree: i32 = get_degree(POLYNOMIAL);
	assert_eq!(x >> degree, 0);
	assert_eq!(y >> degree, 0);
	
	// Russian peasant multiplication algorithm
	let mut z: u64 = 0;
	while y != 0 {
		z ^= x * (y & 1);
		y >>= 1;
		x <<= 1;
		x ^= (x >> degree) * POLYNOMIAL;
	}
	assert_eq!(z >> degree, 0);
	z
}


// Returns polynomial x to the power of natural number y modulo the generator polynomial.
fn pow_mod(mut x: u64, mut y: u64) -> u64 {
	// Exponentiation by squaring
	let mut z: u64 = 1;
	while y != 0 {
		if y & 1 != 0 {
			z = multiply_mod(z, x);
		}
		x = multiply_mod(x, x);
		y >>= 1;
	}
	z
}


// Computes polynomial x divided by polynomial y, returning the quotient and remainder.
fn divide_and_remainder(mut x: u64, y: u64) -> (u64,u64) {
	assert!(y != 0, "Division by zero");
	if x == 0 {
		(0, 0)
	} else {
		let ydeg: i32 = get_degree(y);
		let mut z: u64 = 0;
		for i in (0 .. get_degree(x) - ydeg + 1).rev() {
			let bit = x >> (i + ydeg) & 1;
			x ^= bit * (y << i);
			z |= bit << i;
		}
		(z, x)
	}
}


// Returns the reciprocal of polynomial x with respect to the generator polynomial.
fn reciprocal_mod(mut x: u64) -> u64 {
	assert_eq!(x >> get_degree(POLYNOMIAL), 0);
	
	// Based on a simplification of the extended Euclidean algorithm
	let mut y: u64 = x;
	x = POLYNOMIAL;
	let mut a: u64 = 0;
	let mut b: u64 = 1;
	while y != 0 {
		let (q, r) = divide_and_remainder(x, y);
		let c: u64 = a ^ multiply_mod(q, b);
		x = y;
		y = r;
		a = b;
		b = c;
	}
	assert_eq!(x, 1, "Reciprocal does not exist");
	a
}


fn get_degree(x: u64) -> i32 {
	63 - (x.leading_zeros() as i32)
}
