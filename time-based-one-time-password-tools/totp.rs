/* 
 * Time-based One-Time Password tools (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/time-based-one-time-password-tools
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

use std::convert::TryFrom;
use std::convert::TryInto;
use std::string::String;


/*---- Main program ----*/

fn main() {
	let argv: Vec<String> = std::env::args().collect();
	if argv.len() == 1 {
		test_hotp();
		test_totp();
		eprintln!("Test passed");
	} else if argv.len() == 2 {
		let secretkey: Vec<u8> = decode_base32(&argv[1]);
		let timestamp = std::time::SystemTime::now()
			.duration_since(std::time::SystemTime::UNIX_EPOCH)
			.unwrap().as_secs() as i64;
		let code: String = calc_totp(
			secretkey, 0, 30, timestamp, 6, calc_sha1_hash, 64);
		println!("{}", code);
	} else {
		eprintln!("Usage: totp [SecretKey]");
	}
}


fn decode_base32(s: &str) -> Vec<u8> {
	#[allow(non_snake_case)]
	let ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let mut result = Vec::<u8>::new();
	let mut bits = 0u16;
	let mut bitslen = 0u8;
	for c in s.chars() {
		if c == ' ' {
			continue;
		}
		bits <<= 5;
		bits |= ALPHABET.find(c.to_ascii_uppercase())
			.expect("Invalid Base32 string") as u16;
		bitslen += 5;
		if bitslen >= 8 {
			bitslen -= 8;
			result.push(u8::try_from(bits >> bitslen).unwrap());
			bits &= (1 << bitslen) - 1;
		}
	}
	result
}



/*---- Library functions ----*/

// Time-based One-Time Password algorithm (RFC 6238)
fn calc_totp(
		secretkey: Vec<u8>,
		epoch: i64,
		timestep: i64,
		timestamp: i64,
		codelen: usize,
		hashfunc: fn(Vec<u8>)->Vec<u8>,
		blocksize: usize,
		) -> String {
	
	// Calculate counter and HOTP
	let mut temp: i64 = timestamp - epoch;
	if temp < 0 {
		temp -= timestep - 1;
	}
	let timecounter: i64 = temp / timestep;
	let counter: [u8; 8] = timecounter.to_be_bytes();
	calc_hotp(secretkey, &counter, codelen, hashfunc, blocksize)
}


// HMAC-based One-Time Password algorithm (RFC 4226)
fn calc_hotp(
		secretkey: Vec<u8>,
		counter: &[u8],
		codelen: usize,
		hashfunc: fn(Vec<u8>)->Vec<u8>,
		blocksize: usize,
		) -> String {
	
	// Check argument, calculate HMAC
	assert!(1 <= codelen && codelen <= 9, "Invalid number of digits");
	let hash: Vec<u8> = calc_hmac(secretkey, counter, hashfunc, blocksize);
	
	// Dynamically truncate the hash value
	let offset = usize::from(hash.last().unwrap() & 0xF);
	let slice: [u8; 4] = hash[offset .. offset + 4].try_into().unwrap();
	let val = u32::from_be_bytes(slice) & 0x7FFF_FFFF;
	
	// Extract and format base-10 digits
	let mut result = (val % 10u32.pow(codelen as u32)).to_string();
	while result.len() < codelen {
		result.insert(0, '0');
	}
	result
}


fn calc_hmac(
		mut key: Vec<u8>,
		message: &[u8],
		hashfunc: fn(Vec<u8>)->Vec<u8>,
		blocksize: usize,
		) -> Vec<u8> {
	
	assert!(blocksize >= 1, "Invalid block size");
	if key.len() > blocksize {
		key = hashfunc(key);
	}
	key.resize(blocksize, 0);
	
	let mut innermsg: Vec<u8> = key.iter().map(|&b| b ^ 0x36).collect();
	innermsg.extend_from_slice(message);
	let innerhash: Vec<u8> = hashfunc(innermsg);
	
	let mut outermsg: Vec<u8> = key.iter().map(|&b| b ^ 0x5C).collect();
	outermsg.extend_from_slice(&innerhash);
	hashfunc(outermsg)
}


fn calc_sha1_hash(mut message: Vec<u8>) -> Vec<u8> {
	let bitlenbytes: [u8; 8] = ((message.len() as u64) * 8).to_be_bytes();
	message.push(0x80);
	while (message.len() + 8) % 64 != 0 {
		message.push(0x00);
	}
	message.extend_from_slice(&bitlenbytes);
	
	let mut state: [u32; 5] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
	for block in message.chunks(64) {
		let mut schedule: Vec<u32> = block.chunks(4).map(|bs|
			u32::from_be_bytes(bs.try_into().unwrap())).collect();
		for i in schedule.len() .. 80 {
			let temp: u32 = schedule[i - 3] ^ schedule[i - 8] ^ schedule[i - 14] ^ schedule[i - 16];
			schedule.push(temp.rotate_left(1));
		}
		let mut a: u32 = state[0];
		let mut b: u32 = state[1];
		let mut c: u32 = state[2];
		let mut d: u32 = state[3];
		let mut e: u32 = state[4];
		for (i, &sch) in schedule.iter().enumerate() {
			let (f, rc): (u32,u32) = match i / 20 {
				0 => ((b & c) | (!b & d)         , 0x5A827999),
				1 => (b ^ c ^ d                  , 0x6ED9EBA1),
				2 => ((b & c) ^ (b & d) ^ (c & d), 0x8F1BBCDC),
				3 => (b ^ c ^ d                  , 0xCA62C1D6),
				_ => unreachable!(),
			};
			let temp: u32 = a.rotate_left(5).wrapping_add(f)
				.wrapping_add(e).wrapping_add(sch).wrapping_add(rc);
			e = d;
			d = c;
			c = b.rotate_left(30);
			b = a;
			a = temp;
		}
		state[0] = state[0].wrapping_add(a);
		state[1] = state[1].wrapping_add(b);
		state[2] = state[2].wrapping_add(c);
		state[3] = state[3].wrapping_add(d);
		state[4] = state[4].wrapping_add(e);
	}
	
	state.iter().flat_map(|val| val.to_be_bytes().to_vec()).collect()
}



/*---- Test suite ----*/

#[allow(non_snake_case)]
fn test_hotp() {
	let CASES: Vec<(u64,&str)> = vec![
		(0, "284755224"),
		(1, "094287082"),
		(2, "137359152"),
		(3, "726969429"),
		(4, "640338314"),
		(5, "868254676"),
		(6, "918287922"),
		(7, "082162583"),
		(8, "673399871"),
		(9, "645520489"),
	];
	let SECRET_KEY: &[u8] = b"12345678901234567890";
	
	for &(counter, expect) in &CASES {
		let actual: String = calc_hotp(
			SECRET_KEY.to_vec(), &counter.to_be_bytes(), 9, calc_sha1_hash, 64);
		assert_eq!(expect, actual);
	}
}


#[allow(non_snake_case)]
fn test_totp() {
	let CASES: Vec<(i64,&str)> = vec![
		(         59, "94287082"),
		( 1111111109, "07081804"),
		( 1111111111, "14050471"),
		( 1234567890, "89005924"),
		( 2000000000, "69279037"),
		(20000000000, "65353130"),
	];
	let SECRET_KEY: &[u8] = b"12345678901234567890";
	
	for &(timestamp, expect) in &CASES {
		let actual: String = calc_totp(
			SECRET_KEY.to_vec(), 0, 30, timestamp, 8, calc_sha1_hash, 64);
		assert_eq!(expect, actual);
	}
}
