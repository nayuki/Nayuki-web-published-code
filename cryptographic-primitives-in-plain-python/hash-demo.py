# 
# This program shows how to call a hash function, and displays debugging information.
# Run with no arguments.
# 
# Copyright (c) 2021 Project Nayuki. (MIT License)
# https://www.nayuki.io/page/cryptographic-primitives-in-plain-python
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy of
# this software and associated documentation files (the "Software"), to deal in
# the Software without restriction, including without limitation the rights to
# use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
# the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
# - The above copyright notice and this permission notice shall be included in
#   all copies or substantial portions of the Software.
# - The Software is provided "as is", without warranty of any kind, express or
#   implied, including but not limited to the warranties of merchantability,
#   fitness for a particular purpose and noninfringement. In no event shall the
#   authors or copyright holders be liable for any claim, damages or other
#   liability, whether in an action of contract, tort or otherwise, arising from,
#   out of or in connection with the Software or the use or other dealings in the
#   Software.
# 

import cryptocommon, md5hash, sha256hash


def main() -> None:
	message_hex: str = "FF00CA9634"
	message_bin: bytes = bytes.fromhex(message_hex)
	hash_bin: bytes = md5hash.hash(message_bin, printdebug=True)
	hash_hex: str = hash_bin.hex().upper()
	print(f"Message (hex): {message_hex}")
	print(f"Message (bytes): {list(message_bin)}")
	print(f"MD5 hash (bytes): {list(hash_bin)}")
	print(f"MD5 hash (hex): {hash_hex}")
	print()
	print("-" * 100)
	print()
	
	message_ascii: str = "the quick brown fox"
	message_bin = message_ascii.encode("UTF-8")
	hash_bin = sha256hash.hash(message_bin, printdebug=True)
	hash_hex = hash_bin.hex().upper()
	print(f'Message (ASCII): "{message_ascii}"')
	print(f"Message (bytes): {list(message_bin)}")
	print(f"SHA-256 hash (bytes): {list(hash_bin)}")
	print(f"SHA-256 hash (hex): {hash_hex}")


if __name__ == "__main__":
	main()
