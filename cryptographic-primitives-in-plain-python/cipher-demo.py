# 
# This program shows how to call a cipher, and displays debugging information.
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

import cryptocommon, aescipher


def main() -> None:
	message_hex: str = "3243F6A8885A308D313198A2E0370734"
	key_hex: str = "2B7E151628AED2A6ABF7158809CF4F3C"
	
	plaintext_bin: bytes = cryptocommon.hexstr_to_bytes(message_hex)
	key_bin: bytes = cryptocommon.hexstr_to_bytes(key_hex)
	ciphertext_bin: bytes = aescipher.encrypt(plaintext_bin, key_bin, printdebug=True)
	ciphertext_hex: str = cryptocommon.bytes_to_hexstr(ciphertext_bin)
	assert aescipher.decrypt(ciphertext_bin, key_bin) == plaintext_bin
	
	print(f"Plaintext  (hex): {message_hex}")
	print(f"Ciphertext (hex): {ciphertext_hex}")
	print(f"Key        (hex): {key_hex}")
	print(f"Plaintext  (bytelist): {list(plaintext_bin)}")
	print(f"Ciphertext (bytelist): {list(ciphertext_bin)}")
	print(f"Key        (bytelist): {list(key_bin)}")


if __name__ == "__main__":
	main()
