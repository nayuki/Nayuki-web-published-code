# 
# This program tests the implementations of all the known cryptographic hash functions.
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

import hashlib, random, unittest
from cryptocommon import asciistr_to_bytelist, hexstr_to_bytelist
from typing import Callable, List, Tuple, Union


# ---- Test suite functions ----

class HashTest(unittest.TestCase):
	
	def test_md2_hash(self) -> None:
		import md2hash
		self._check_hash_function(md2hash.hash, [
			("8350E5A3E24C153DF2275C9F80692773", ""),
			("32EC01EC4A6DAC72C0AB96FB34C0B5D1", "a"),
			("DA853B0D3F88D99B30283A69E6DED6BB", "abc"),
			("AB4F496BFB2A530B219FF33031FE06B0", "message digest"),
			("4E8DDFF3650292AB5A4108C3AA47940B", "abcdefghijklmnopqrstuvwxyz"),
			("DA33DEF2A42DF13975352846C30338CD", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"),
			("D5976F79D83D3A0DC9806C3C66F3EFD8", "12345678901234567890123456789012345678901234567890123456789012345678901234567890"),
		])
	
	
	def test_md4_hash(self) -> None:
		import md4hash
		self._check_hash_function(md4hash.hash, [
			("31D6CFE0D16AE931B73C59D7E0C089C0", ""),
			("BDE52CB31DE33E46245E05FBDBD6FB24", "a"),
			("A448017AAF21D8525FC10AE87AA6729D", "abc"),
			("D9130A8164549FE818874806E1C7014B", "message digest"),
			("D79E1C308AA5BBCDEEA8ED63DF412DA9", "abcdefghijklmnopqrstuvwxyz"),
			("043F8582F241DB351CE627E153E7F0E4", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"),
			("E33B4DDC9C38F2199C3E7B164FCC0536", "12345678901234567890123456789012345678901234567890123456789012345678901234567890"),
		])
	
	
	def test_md5_hash(self) -> None:
		import md5hash
		self._check_hash_function(md5hash.hash, [
			("D41D8CD98F00B204E9800998ECF8427E", ""),
			("0CC175B9C0F1B6A831C399E269772661", "a"),
			("900150983CD24FB0D6963F7D28E17F72", "abc"),
			("F96B697D7CB7938D525A2F31AAF161D0", "message digest"),
			("C3FCD3D76192E4007DFB496CCA67E13B", "abcdefghijklmnopqrstuvwxyz"),
			("D174AB98D277D9F5A5611C2C9F419D9F", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"),
			("57EDF4A22BE3C955AC49DA2E2107B67A", "12345678901234567890123456789012345678901234567890123456789012345678901234567890"),
		])
		self._check_vs_stdlib(md5hash.hash, hashlib.md5)
	
	
	def test_sha1_hash(self) -> None:
		import sha1hash
		self._check_hash_function(sha1hash.hash, [
			("DA39A3EE5E6B4B0D3255BFEF95601890AFD80709", ""),
			("86F7E437FAA5A7FCE15D1DDCB9EAEAEA377667B8", "a"),
			("A9993E364706816ABA3E25717850C26C9CD0D89D", "abc"),
			("C12252CEDA8BE8994D5FA0290A47231C1D16AAE3", "message digest"),
			("32D10C7B8CF96570CA04CE37F2A19D84240D3A89", "abcdefghijklmnopqrstuvwxyz"),
			("84983E441C3BD26EBAAE4AA1F95129E5E54670F1", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("A49B2446A02C645BF419F995B67091253A04A259", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha1hash.hash, hashlib.sha1)
	
	
	def test_sha256_hash(self) -> None:
		import sha256hash
		self._check_hash_function(sha256hash.hash, [
			("E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855", ""),
			("CA978112CA1BBDCAFAC231B39A23DC4DA786EFF8147C4E72B9807785AFEE48BB", "a"),
			("BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD", "abc"),
			("F7846F55CF23E14EEBEAB5B4E1550CAD5B509E3348FBC4EFA3A1413D393CB650", "message digest"),
			("71C480DF93D6AE2F1EFAD1447C66C9525E316218CF51FC8D9ED832F2DAF18B73", "abcdefghijklmnopqrstuvwxyz"),
			("248D6A61D20638B8E5C026930C3E6039A33CE45964FF2167F6ECEDD419DB06C1", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("CF5B16A778AF8380036CE59E7B0492370B249B11E8F07A51AFAC45037AFEE9D1", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha256hash.hash, hashlib.sha256)
	
	
	def test_sha512_hash(self) -> None:
		import sha512hash
		self._check_hash_function(sha512hash.hash, [
			("CF83E1357EEFB8BDF1542850D66D8007D620E4050B5715DC83F4A921D36CE9CE47D0D13C5D85F2B0FF8318D2877EEC2F63B931BD47417A81A538327AF927DA3E", ""),
			("1F40FC92DA241694750979EE6CF582F2D5D7D28E18335DE05ABC54D0560E0F5302860C652BF08D560252AA5E74210546F369FBBBCE8C12CFC7957B2652FE9A75", "a"),
			("DDAF35A193617ABACC417349AE20413112E6FA4E89A97EA20A9EEEE64B55D39A2192992A274FC1A836BA3C23A3FEEBBD454D4423643CE80E2A9AC94FA54CA49F", "abc"),
			("107DBF389D9E9F71A3A95F6C055B9251BC5268C2BE16D6C13492EA45B0199F3309E16455AB1E96118E8A905D5597B72038DDB372A89826046DE66687BB420E7C", "message digest"),
			("4DBFF86CC2CA1BAE1E16468A05CB9881C97F1753BCE3619034898FAA1AABE429955A1BF8EC483D7421FE3C1646613A59ED5441FB0F321389F77F48A879C7B1F1", "abcdefghijklmnopqrstuvwxyz"),
			("204A8FC6DDA82F0A0CED7BEB8E08A41657C16EF468B228A8279BE331A703C33596FD15C13B1B07F9AA1D3BEA57789CA031AD85C7A71DD70354EC631238CA3445", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("8E959B75DAE313DA8CF4F72814FC143F8F7779C6EB9F7FA17299AEADB6889018501D289E4900F7E4331B99DEC4B5433AC7D329EEB6DD26545E96E55B874BE909", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha512hash.hash, hashlib.sha512)
	
	
	def test_sha3_224_hash(self) -> None:
		import sha3hash
		self._check_hash_function(sha3hash.hash224, [
			("6B4E03423667DBB73B6E15454F0EB1ABD4597F9A1B078E3F5B5A6BC7", ""),
			("E642824C3F8CF24AD09234EE7D3C766FC9A3A5168D0C94AD73B46FDF", "abc"),
			("8A24108B154ADA21C9FD5574494479BA5C7E7AB76EF264EAD0FCCE33", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("543E6868E1666C1A643630DF77367AE5A62A85070A51C14CBF665CBC", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha3hash.hash224, hashlib.sha3_224)
	
	
	def test_sha3_256_hash(self) -> None:
		import sha3hash
		self._check_hash_function(sha3hash.hash256, [
			("A7FFC6F8BF1ED76651C14756A061D662F580FF4DE43B49FA82D80A4B80F8434A", ""),
			("3A985DA74FE225B2045C172D6BD390BD855F086E3E9D525B46BFE24511431532", "abc"),
			("41C0DBA2A9D6240849100376A8235E2C82E1B9998A999E21DB32DD97496D3376", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("916F6061FE879741CA6469B43971DFDB28B1A32DC36CB3254E812BE27AAD1D18", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha3hash.hash256, hashlib.sha3_256)
	
	
	def test_sha3_384_hash(self) -> None:
		import sha3hash
		self._check_hash_function(sha3hash.hash384, [
			("0C63A75B845E4F7D01107D852E4C2485C51A50AAAA94FC61995E71BBEE983A2AC3713831264ADB47FB6BD1E058D5F004", ""),
			("EC01498288516FC926459F58E2C6AD8DF9B473CB0FC08C2596DA7CF0E49BE4B298D88CEA927AC7F539F1EDF228376D25", "abc"),
			("991C665755EB3A4B6BBDFB75C78A492E8C56A22C5C4D7E429BFDBC32B9D4AD5AA04A1F076E62FEA19EEF51ACD0657C22", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("79407D3B5916B59C3E30B09822974791C313FB9ECC849E406F23592D04F625DC8C709B98B43B3852B337216179AA7FC7", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha3hash.hash384, hashlib.sha3_384)
	
	
	def test_sha3_512_hash(self) -> None:
		import sha3hash
		self._check_hash_function(sha3hash.hash512, [
			("A69F73CCA23A9AC5C8B567DC185A756E97C982164FE25859E0D1DCC1475C80A615B2123AF1F5F94C11E3E9402C3AC558F500199D95B6D3E301758586281DCD26", ""),
			("B751850B1A57168A5693CD924B6B096E08F621827444F70D884F5D0240D2712E10E116E9192AF3C91A7EC57647E3934057340B4CF408D5A56592F8274EEC53F0", "abc"),
			("04A371E84ECFB5B8B77CB48610FCA8182DD457CE6F326A0FD3D7EC2F1E91636DEE691FBE0C985302BA1B0D8DC78C086346B533B49C030D99A27DAF1139D6E75E", "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
			("AFEBB2EF542E6579C50CAD06D2E578F9F8DD6881D7DC824D26360FEEBF18A4FA73E3261122948EFCFD492E74E82E2189ED0FB440D187F382270CB455F21DD185", "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu"),
		])
		self._check_vs_stdlib(sha3hash.hash512, hashlib.sha3_512)
	
	
	def test_whirlpool_hash(self) -> None:
		import whirlpoolhash
		self._check_hash_function(whirlpoolhash.hash, [
			("19FA61D75522A4669B44E39C1D2E1726C530232130D407F89AFEE0964997F7A73E83BE698B288FEBCF88E3E03C4F0757EA8964E59B63D93708B138CC42A66EB3", ""),
			("B97DE512E91E3828B40D2B0FDCE9CEB3C4A71F9BEA8D88E75C4FA854DF36725FD2B52EB6544EDCACD6F8BEDDFEA403CB55AE31F03AD62A5EF54E42EE82C3FB35", "The quick brown fox jumps over the lazy dog"),
			("C27BA124205F72E6847F3E19834F925CC666D0974167AF915BB462420ED40CC50900D85A1F923219D832357750492D5C143011A76988344C2635E69D06F2D38C", "The quick brown fox jumps over the lazy eog"),
		])
	
	
	# Private utilities
	
	def _check_hash_function(self, func: Callable[[bytes],bytes], cases: List[Tuple[str,str]]) -> None:
		global num_test_cases
		
		for (expecthash, messagestr) in cases:
			msgbytelist = asciistr_to_bytelist(messagestr)
			actualhashbytelist = func(msgbytelist)
			expectedhashbytelist = hexstr_to_bytelist(expecthash)
			
			self.assertEqual(actualhashbytelist, expectedhashbytelist)
			num_test_cases += 1
	
	
	def _check_vs_stdlib(self, ourfunc: Callable[[bytes],bytes], stdfunc: Callable[[bytes],hashlib._Hash]):
		global num_test_cases
		trials = 1000
		for _ in range(trials):
			msglen = random.randrange(1000)
			msglist = bytes(random.randrange(256) for _ in range(msglen))
			msgstr = bytes(msglist)
			actualhash = ourfunc(msglist)
			expecthash = stdfunc(msgstr).digest()
			self.assertEqual(actualhash, expecthash)
			num_test_cases += 1



# ---- Main runner ----

if __name__ == "__main__":
	num_test_cases = 0
	unittest.main(exit=False)
	print(f"Tested {num_test_cases} vectors")
