/* 
 * BitTorrent bencode coder test suite (Rust)
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

use std::collections::BTreeMap;
use std::io::ErrorKind;
mod bencode;
use bencode::Bencode;
use bencode::Bencode::{Int, Bytes, List, Dict};


fn main() {
	test_serialize_integer();
	test_serialize_byte_string();
	test_serialize_list();
	test_serialize_dictionary();
	
	test_parse_empty();
	test_parse_invalid();
	test_parse_integer();
	test_parse_integer_eof();
	test_parse_integer_invalid();
	test_parse_byte_string();
	test_parse_byte_string_eof();
	test_parse_byte_string_invalid();
	test_parse_list();
	test_parse_list_eof();
	test_parse_dictionary();
	test_parse_dictionary_eof();
	test_parse_dictionary_invalid();
}



/*---- Test the serialization ----*/

fn test_serialize_integer() {
	check_serialize("i0e", &Int(0));
	check_serialize("i2e", &Int(2));
	check_serialize("i-1e", &Int(-1));
	check_serialize("i3141592e", &Int(3141592));
	check_serialize("i-27182818284e", &Int(-27182818284));
}


fn test_serialize_byte_string() {
	check_serialize("0:", &Bytes(vec![]));
	check_serialize("1:\u{0}", &Bytes(vec![0]));
	check_serialize("2:\u{4}\u{1}", &Bytes(b"\x04\x01".to_vec()));
	check_serialize("3:ben", &Bytes(b"ben".to_vec()));
	check_serialize("10:ABCDE98765", &Bytes(b"ABCDE98765".to_vec()));
}


fn test_serialize_list() {
	check_serialize("le", &List(vec![]));
	check_serialize("li4ee", &List(vec![Int(4)]));
	check_serialize("li7e5:Helloe", &List(vec![Int(7), Bytes(b"Hello".to_vec())]));
	check_serialize("li-88ele1:Xe", &List(vec![Int(-88), List(vec![]), Bytes(vec![b'X'])]));
}


fn test_serialize_dictionary() {
	check_serialize("de", &Dict(BTreeMap::new()));
	{
		let mut d = BTreeMap::<Vec<u8>,Bencode>::new();
		d.insert(b"".to_vec(), List(vec![]));
		check_serialize("d0:lee", &Dict(d));
	}
	{
		let mut d = BTreeMap::<Vec<u8>,Bencode>::new();
		d.insert(b"ZZ".to_vec(), Int(768));
		d.insert(b"AAA".to_vec(), Bytes(b"-14142".to_vec()));
		check_serialize("d3:AAA6:-141422:ZZi768ee", &Dict(d));
	}
	{
		let mut d = BTreeMap::<Vec<u8>,Bencode>::new();
		d.insert(b"\x03".to_vec(), List(vec![]));
		d.insert(b"\x08".to_vec(), Dict(BTreeMap::new()));
		check_serialize("d1:\u{3}le1:\u{8}dee", &Dict(d));
	}
}


// Asserts that serializing the given bencode value equals the given byte string.
fn check_serialize(expected: &str, obj: &Bencode) {
	let mut actual = Vec::<u8>::new();
	Bencode::serialize(obj, &mut actual).unwrap();
	assert_eq!(expected.as_bytes(), &actual[..]);
}



/*---- Test the parsing ----*/

fn test_parse_empty() {
	parse_expecting_exception(&[""],
		ErrorKind::UnexpectedEof);
}


fn test_parse_invalid() {
	parse_expecting_exception(&[
		"i0ei1e",
		"1:a2:bc3:def",
		"le0:de",
	], ErrorKind::InvalidData);
}


fn test_parse_integer() {
	check_parse(&Int(0), "i0e");
	check_parse(&Int(11), "i11e");
	check_parse(&Int(-749), "i-749e");
	check_parse(&Int(9223372036854775807), "i9223372036854775807e");
	check_parse(&Int(-9223372036854775808), "i-9223372036854775808e");
}


fn test_parse_integer_eof() {
	parse_expecting_exception(&[
		"i",
		"i0",
		"i1248",
		"i-",
	], ErrorKind::UnexpectedEof);
}


fn test_parse_integer_invalid() {
	parse_expecting_exception(&[
		"ie",
		"i00",
		"i00e",
		"i019",
		"i0199e",
		"i-e",
		"i-0",
		"i-0e",
		"i-026e",
		"i-B",
		"iA",
		"iAe",
		"i01Ce",
		"i+5e",
		"i4.0e",
		"i9E9e",
	], ErrorKind::InvalidData);
}


fn test_parse_byte_string() {
	check_parse(&Bytes(b"".to_vec()), "0:");
	check_parse(&Bytes(b"&".to_vec()), "1:&");
	check_parse(&Bytes(b"abcdefghijklm".to_vec()), "13:abcdefghijklm");
}


fn test_parse_byte_string_eof() {
	parse_expecting_exception(&[
		"0",
		"1",
		"843",
		"1:",
		"2:",
		"2:q",
		"d",
		"d3:$",
	], ErrorKind::UnexpectedEof);
}


fn test_parse_byte_string_invalid() {
	parse_expecting_exception(&[
		"00",
		"01",
		"00:",
		"01:",
		"-",
		"-0",
		"-1:",
	], ErrorKind::InvalidData);
}


fn test_parse_list() {
	check_parse(&List(vec![]), "le");
	check_parse(&List(vec![Int(-6)]), "li-6ee");
	check_parse(&List(vec![Bytes(b"00".to_vec()), Int(55)]), "l2:00i55ee");
	check_parse(&List(vec![List(vec![]), List(vec![])]), "llelee");
}


fn test_parse_list_eof() {
	parse_expecting_exception(&[
		"l",
		"li0e",
		"llleleel",
	], ErrorKind::UnexpectedEof);
}


fn test_parse_dictionary() {
	check_parse(&Dict(BTreeMap::new()), "de");
	{
		let mut d = BTreeMap::<Vec<u8>,Bencode>::new();
		d.insert(b"-".to_vec(), Int(404));
		check_parse(&Dict(d), "d1:-i404ee");
	}
	{
		let mut d = BTreeMap::<Vec<u8>,Bencode>::new();
		d.insert(b"010".to_vec(), Bytes(b"101".to_vec()));
		d.insert(b"yU".to_vec(), List(vec![]));
		check_parse(&Dict(d), "d3:0103:1012:yUlee");
	}
}


fn test_parse_dictionary_eof() {
	parse_expecting_exception(&[
		"d",
		"d1::",
		"d2:  0:",
		"d0:d",
	], ErrorKind::UnexpectedEof);
}


fn test_parse_dictionary_invalid() {
	parse_expecting_exception(&[
		"d:",
		"d-",
		"d1:A0:1:A1:.",
		"d1:B0:1:A1:.",
		"d1:B0:1:D0:1:C0:",
		"d1:E0:1:F0:1:E0:",
		"d2:gg0:1:g0:",
	], ErrorKind::InvalidData);
}


// Asserts that parsing the given byte string equals the given bencode value.
fn check_parse(expect: &Bencode, s: &str) {
	let actual: Bencode = try_parse(s).unwrap();
	assert_eq!(*expect, actual);
}


// Parses the given string into a bencode value.
fn try_parse(s: &str) -> std::io::Result<Bencode> {
	Bencode::parse(Box::new(s.as_bytes()).as_mut())
}


// Asserts that parsing each given test case will return the given exception.
fn parse_expecting_exception(testcases: &[&str], expect: ErrorKind) {
	for cs in testcases {
		let actual: std::io::Result<Bencode> = try_parse(cs);
		let err: std::io::Error = actual.unwrap_err();
		assert_eq!(expect, err.kind());
	}
}
