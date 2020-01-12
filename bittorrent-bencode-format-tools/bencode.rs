/* 
 * BitTorrent bencode encoder/decoder (Rust)
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
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

use std::io;


#[derive(Clone, Eq, PartialEq, Debug)]
pub enum Bencode {
	Int(i64),
	Bytes(Vec<u8>),
	List(Vec<Bencode>),
	Dict(std::collections::BTreeMap<Vec<u8>,Bencode>),
}


impl Bencode {
	
	/*---- Serializer ----*/
	
	pub fn serialize(&self, out: &mut dyn io::Write) -> io::Result<()> {
		match *self {
			Self::Int(num) => {
				let temp: String = format!("i{}e", num);
				out.write_all(temp.as_bytes())
			},
			Self::Bytes(ref bytes) => {
				Self::serialize_bytes(bytes, out)
			},
			Self::List(ref list) => {
				out.write_all(b"l")?;
				for item in list {
					item.serialize(out)?;
				}
				out.write_all(b"e")
			},
			Self::Dict(ref dict) => {
				out.write_all(b"d")?;
				for (key, item) in dict {
					Self::serialize_bytes(key, out)?;
					item.serialize(out)?;
				}
				out.write_all(b"e")
			},
		}
	}
	
	
	fn serialize_bytes(bytes: &[u8], out: &mut dyn io::Write) -> io::Result<()> {
		let temp: String = format!("{}:", bytes.len());
		out.write_all(temp.as_bytes())?;
		out.write_all(bytes)
	}
	
	
	
	/*---- Parser ----*/
	
	pub fn parse(input: &mut dyn io::Read) -> io::Result<Self> {
		Parser { input }.parse()
	}
	
}


struct Parser<'a> {
	input: &'a mut dyn io::Read,
}


impl<'a> Parser<'a> {
	
	pub fn parse(&mut self) -> io::Result<Bencode> {
		let mut b = self.read_byte()?;
		let result = self.parse_value(b)?;
		if self.input.read(std::slice::from_mut(&mut b))? > 0 {
			return Parser::err_invalid_data("Unexpected extra data");
		}
		Ok(result)
	}
	
	
	fn parse_value(&mut self, head: u8) -> io::Result<Bencode> {
		match head {
			b'i' => self.parse_integer(),
			b'l' => self.parse_list(),
			b'd' => self.parse_dictionary(),
			b'0'..=b'9' => Ok(Bencode::Bytes(self.parse_byte_string(head)?)),
			_ => Parser::err_invalid_data("Unexpected value type"),
		}
	}
	
	
	fn parse_integer(&mut self) -> io::Result<Bencode> {
		let mut s = String::new();
		loop {
			let b = self.read_byte()?;
			if b == b'e' {
				break;
			}
			
			let ok = if s == "" {
				b == b'-' || b'0' <= b && b <= b'9'
			} else if s == "-" {
				b'1' <= b && b <= b'9'
			} else if s == "0" {
				false
			} else {  // s starts with [123456789] or -[123456789]
				b'0' <= b && b <= b'9'
			};
			
			if !ok {
				return Parser::err_invalid_data("Unexpected integer character");
			}
			s.push(char::from(b));
		}
		if s == "" || s == "-" {
			return Parser::err_invalid_data("Invalid integer syntax");
		}
		s.parse::<i64>().map(Bencode::Int)
			.map_err(|_| Parser::invalid_data("Integer overflow"))
	}
	
	
	fn parse_byte_string(&mut self, head: u8) -> io::Result<Vec<u8>> {
		let length = self.parse_natural_number(head)?;
		let mut result = vec![0u8; length];
		self.input.read_exact(&mut result)?;
		Ok(result)
	}
	
	
	fn parse_natural_number(&mut self, head: u8) -> io::Result<usize> {
		let mut s = String::new();
		let mut b = head;
		loop {
			if b < b'0' || b > b'9' || s == "0" {
				return Parser::err_invalid_data("Unexpected integer character");
			}
			s.push(char::from(b));
			b = self.read_byte()?;
			if b == b':' {
				break;
			}
		}
		s.parse::<usize>()
			.map_err(|_| Parser::invalid_data("Integer overflow"))
	}
	
	
	fn parse_list(&mut self) -> io::Result<Bencode> {
		let mut result = Vec::<Bencode>::new();
		loop {
			match self.read_byte()? {
				b'e' => break,
				b => result.push(self.parse_value(b)?),
			}
		}
		Ok(Bencode::List(result))
	}
	
	
	fn parse_dictionary(&mut self) -> io::Result<Bencode> {
		let mut result = std::collections::BTreeMap::<Vec<u8>,Bencode>::new();
		loop {
			let key = match self.read_byte()? {
				b'e' => break,
				b => self.parse_byte_string(b)?,
			};
			let prevkey = result.keys().next_back();
			if prevkey.map_or(false, |k| key <= *k) {
				return Parser::err_invalid_data("Misordered dictionary key");
			}
			let b = self.read_byte()?;
			let val = self.parse_value(b)?;
			result.insert(key, val);
		}
		Ok(Bencode::Dict(result))
	}
	
	
	pub fn read_byte(&mut self) -> io::Result<u8> {
		let mut result = 0u8;
		self.input.read_exact(std::slice::from_mut(&mut result))?;
		Ok(result)
	}
	
	
	fn err_invalid_data<T>(msg: &str) -> io::Result<T> {
		Err(Parser::invalid_data(msg))
	}
	
	
	fn invalid_data(msg: &str) -> io::Error {
		io::Error::new(io::ErrorKind::InvalidData, msg)
	}
	
}
