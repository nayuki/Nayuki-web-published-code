/* 
 * SHA-512 hash in x86 assembly
 * 
 * Copyright (c) 2013 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/fast-sha2-hashes-in-x86-assembly
 */


/* 
 * Storage usage:
 *   Bytes  Location   Description
 *       4  eax        Temporary for calculation per round
 *       4  ebx        Temporary for calculation per round
 *       4  ecx        Temporary for calculation per round
 *       4  edx        Temporary for calculation per round
 *       4  ebp        Temporary for calculation per round
 *       4  esi        Temporary for calculation per round
 *       4  edi        Temporary for calculation per round
 *       4  esp        x86 stack pointer
 *       8  [esp+  0]  Temporary for calculation per round (scratch space)
 *      64  [esp+  8]  SHA-512 state variables A,B,C,D,E,F,G,H (8 bytes each)
 *     640  [esp+ 72]  Key schedule of 80 * 8 bytes
 *       4  [esp+712]  Caller's value of ebp
 *       4  [esp+716]  Caller's value of edi
 *       4  [esp+720]  Caller's value of esi
 *       4  [esp+724]  Caller's value of ebx
 */

#define SCHEDLO(i)  ((i)*8+72)(%esp)
#define SCHEDHI(i)  ((i)*8+76)(%esp)

#define LOADSCHEDULE(i)            \
	movl    (i*8+0)(%esi), %eax;   \
	movl    (i*8+4)(%esi), %ebx;   \
	bswapl  %eax;                  \
	bswapl  %ebx;                  \
	movl    %eax, SCHEDHI(i);      \
	movl    %ebx, SCHEDLO(i);

#define SCHEDULE(i)              \
	/* smallSigma0 */            \
	movl   SCHEDLO(i-15), %eax;  \
	movl   SCHEDHI(i-15), %ebx;  \
	movl   %eax, %ecx;           \
	movl   %ebx, %edx;           \
	shrdl  $1, %ebx, %ecx;       \
	shrdl  $1, %eax, %edx;       \
	movl   %eax, %esi;           \
	movl   %ebx, %edi;           \
	shrdl  $8, %ebx, %esi;       \
	shrdl  $8, %eax, %edi;       \
	xorl   %esi, %ecx;           \
	xorl   %edi, %edx;           \
	shrdl  $7, %ebx, %eax;       \
	shrl   $7, %ebx;             \
	xorl   %eax, %ecx;           \
	xorl   %ebx, %edx;           \
	movl   %ecx, 0(%esp);        \
	movl   %edx, 4(%esp);        \
	/* smallSigma1 */            \
	movl   SCHEDLO(i-2), %eax;   \
	movl   SCHEDHI(i-2), %ebx;   \
	movl   %eax, %ecx;           \
	movl   %ebx, %edx;           \
	shrdl  $19, %ebx, %ecx;      \
	shrdl  $19, %eax, %edx;      \
	movl   %eax, %esi;           \
	movl   %ebx, %edi;           \
	shldl  $3, %ebx, %esi;       \
	shldl  $3, %eax, %edi;       \
	xorl   %esi, %ecx;           \
	xorl   %edi, %edx;           \
	shrdl  $6, %ebx, %eax;       \
	shrl   $6, %ebx;             \
	xorl   %eax, %ecx;           \
	xorl   %ebx, %edx;           \
	addl   0(%esp), %ecx;        \
	adcl   4(%esp), %edx;        \
	/* The rest */               \
	addl   SCHEDLO(i-7), %ecx;   \
	adcl   SCHEDHI(i-7), %edx;   \
	addl   SCHEDLO(i-16), %ecx;  \
	adcl   SCHEDHI(i-16), %edx;  \
	movl   %ecx, SCHEDLO(i);     \
	movl   %edx, SCHEDHI(i);

#define STATELO(i)  ((i)*8+ 8)(%esp)
#define STATEHI(i)  ((i)*8+12)(%esp)

#define ROUND(i, a, b, c, d, e, f, g, h, k1, k0)  \
	/* bigSigma1 */           \
	movl   STATELO(e), %eax;  \
	movl   STATEHI(e), %ebx;  \
	movl   %eax, %ecx;        \
	movl   %ebx, %edx;        \
	movl   %eax, %ebp;        \
	shrdl  $14, %ebx, %ecx;   \
	shrdl  $14, %eax, %edx;   \
	movl   %eax, %esi;        \
	movl   %ebx, %edi;        \
	shrdl  $18, %ebx, %esi;   \
	shrdl  $18, %eax, %edi;   \
	xorl   %esi, %ecx;        \
	xorl   %edi, %edx;        \
	movl   %eax, %esi;        \
	shldl  $23, %ebx, %eax;   \
	shldl  $23, %esi, %ebx;   \
	xorl   %eax, %ecx;        \
	xorl   %ebx, %edx;        \
	/* choose */              \
	movl   STATELO(g), %eax;  \
	movl   STATEHI(g), %ebx;  \
	movl   %eax, %esi;        \
	movl   %ebx, %edi;        \
	xorl   STATELO(f), %esi;  \
	xorl   STATEHI(f), %edi;  \
	andl   %ebp, %esi;        \
	andl   STATEHI(e), %edi;  \
	xorl   %esi, %eax;        \
	xorl   %edi, %ebx;        \
	/* Sum */                 \
	addl   $k0, %ecx;         \
	adcl   $k1, %edx;         \
	addl   STATELO(h), %eax;  \
	adcl   STATEHI(h), %ebx;  \
	addl   %ecx, %eax;        \
	adcl   %edx, %ebx;        \
	addl   SCHEDLO(i), %eax;  \
	adcl   SCHEDHI(i), %ebx;  \
	movl   %eax, 0(%esp);     \
	movl   %ebx, 4(%esp);     \
	/* Update d */            \
	addl   %eax, STATELO(d);  \
	adcl   %ebx, STATEHI(d);  \
	/* bigSigma0 */           \
	movl   STATELO(a), %eax;  \
	movl   STATEHI(a), %ebx;  \
	movl   %eax, %ecx;        \
	movl   %ebx, %edx;        \
	movl   %eax, %ebp;        \
	shrdl  $28, %ebx, %ecx;   \
	shrdl  $28, %eax, %edx;   \
	movl   %eax, %esi;        \
	movl   %ebx, %edi;        \
	shldl  $30, %ebx, %esi;   \
	shldl  $30, %eax, %edi;   \
	xorl   %esi, %ecx;        \
	xorl   %edi, %edx;        \
	movl   %eax, %esi;        \
	shldl  $25, %ebx, %eax;   \
	shldl  $25, %esi, %ebx;   \
	xorl   %eax, %ecx;        \
	xorl   %ebx, %edx;        \
	/* majority */            \
	movl   STATELO(b), %eax;  \
	movl   STATELO(c), %ebx;  \
	movl   %eax, %esi;        \
	orl    %ebx, %eax;        \
	andl   %esi, %ebx;        \
	andl   %ebp, %eax;        \
	orl    %ebx, %eax;        \
	addl   %eax, %ecx;        \
	adcl   $0, %edx;          \
	movl   STATEHI(b), %eax;  \
	movl   STATEHI(c), %ebx;  \
	movl   %eax, %esi;        \
	orl    %ebx, %eax;        \
	andl   %esi, %ebx;        \
	andl   STATEHI(a), %eax;  \
	orl    %ebx, %eax;        \
	addl   %eax, %edx;        \
	/* Update h */            \
	addl   0(%esp), %ecx;     \
	adcl   4(%esp), %edx;     \
	movl   %ecx, STATELO(h);  \
	movl   %edx, STATEHI(h);

/* void sha512_compress(uint64_t *state, uint32_t *block) */
.globl sha512_compress
sha512_compress:
	/* Save registers, allocate scratch space */
	pushl %ebx
	pushl %esi
	pushl %edi
	pushl %ebp
	subl $712, %esp
	
	/* Copy state */
	movl $16, %ecx
	movl 732(%esp), %esi
	leal 8(%esp), %edi
	rep movsl
	
	/* Load and expand key schedule */
	movl 736(%esp), %esi
	LOADSCHEDULE( 0)
	LOADSCHEDULE( 1)
	LOADSCHEDULE( 2)
	LOADSCHEDULE( 3)
	LOADSCHEDULE( 4)
	LOADSCHEDULE( 5)
	LOADSCHEDULE( 6)
	LOADSCHEDULE( 7)
	LOADSCHEDULE( 8)
	LOADSCHEDULE( 9)
	LOADSCHEDULE(10)
	LOADSCHEDULE(11)
	LOADSCHEDULE(12)
	LOADSCHEDULE(13)
	LOADSCHEDULE(14)
	LOADSCHEDULE(15)
	SCHEDULE(16)
	SCHEDULE(17)
	SCHEDULE(18)
	SCHEDULE(19)
	SCHEDULE(20)
	SCHEDULE(21)
	SCHEDULE(22)
	SCHEDULE(23)
	SCHEDULE(24)
	SCHEDULE(25)
	SCHEDULE(26)
	SCHEDULE(27)
	SCHEDULE(28)
	SCHEDULE(29)
	SCHEDULE(30)
	SCHEDULE(31)
	SCHEDULE(32)
	SCHEDULE(33)
	SCHEDULE(34)
	SCHEDULE(35)
	SCHEDULE(36)
	SCHEDULE(37)
	SCHEDULE(38)
	SCHEDULE(39)
	SCHEDULE(40)
	SCHEDULE(41)
	SCHEDULE(42)
	SCHEDULE(43)
	SCHEDULE(44)
	SCHEDULE(45)
	SCHEDULE(46)
	SCHEDULE(47)
	SCHEDULE(48)
	SCHEDULE(49)
	SCHEDULE(50)
	SCHEDULE(51)
	SCHEDULE(52)
	SCHEDULE(53)
	SCHEDULE(54)
	SCHEDULE(55)
	SCHEDULE(56)
	SCHEDULE(57)
	SCHEDULE(58)
	SCHEDULE(59)
	SCHEDULE(60)
	SCHEDULE(61)
	SCHEDULE(62)
	SCHEDULE(63)
	SCHEDULE(64)
	SCHEDULE(65)
	SCHEDULE(66)
	SCHEDULE(67)
	SCHEDULE(68)
	SCHEDULE(69)
	SCHEDULE(70)
	SCHEDULE(71)
	SCHEDULE(72)
	SCHEDULE(73)
	SCHEDULE(74)
	SCHEDULE(75)
	SCHEDULE(76)
	SCHEDULE(77)
	SCHEDULE(78)
	SCHEDULE(79)
	
	/* Do 80 rounds of hashing */
	ROUND( 0, 0, 1, 2, 3, 4, 5, 6, 7, 0x428A2F98, 0xD728AE22)
	ROUND( 1, 7, 0, 1, 2, 3, 4, 5, 6, 0x71374491, 0x23EF65CD)
	ROUND( 2, 6, 7, 0, 1, 2, 3, 4, 5, 0xB5C0FBCF, 0xEC4D3B2F)
	ROUND( 3, 5, 6, 7, 0, 1, 2, 3, 4, 0xE9B5DBA5, 0x8189DBBC)
	ROUND( 4, 4, 5, 6, 7, 0, 1, 2, 3, 0x3956C25B, 0xF348B538)
	ROUND( 5, 3, 4, 5, 6, 7, 0, 1, 2, 0x59F111F1, 0xB605D019)
	ROUND( 6, 2, 3, 4, 5, 6, 7, 0, 1, 0x923F82A4, 0xAF194F9B)
	ROUND( 7, 1, 2, 3, 4, 5, 6, 7, 0, 0xAB1C5ED5, 0xDA6D8118)
	ROUND( 8, 0, 1, 2, 3, 4, 5, 6, 7, 0xD807AA98, 0xA3030242)
	ROUND( 9, 7, 0, 1, 2, 3, 4, 5, 6, 0x12835B01, 0x45706FBE)
	ROUND(10, 6, 7, 0, 1, 2, 3, 4, 5, 0x243185BE, 0x4EE4B28C)
	ROUND(11, 5, 6, 7, 0, 1, 2, 3, 4, 0x550C7DC3, 0xD5FFB4E2)
	ROUND(12, 4, 5, 6, 7, 0, 1, 2, 3, 0x72BE5D74, 0xF27B896F)
	ROUND(13, 3, 4, 5, 6, 7, 0, 1, 2, 0x80DEB1FE, 0x3B1696B1)
	ROUND(14, 2, 3, 4, 5, 6, 7, 0, 1, 0x9BDC06A7, 0x25C71235)
	ROUND(15, 1, 2, 3, 4, 5, 6, 7, 0, 0xC19BF174, 0xCF692694)
	ROUND(16, 0, 1, 2, 3, 4, 5, 6, 7, 0xE49B69C1, 0x9EF14AD2)
	ROUND(17, 7, 0, 1, 2, 3, 4, 5, 6, 0xEFBE4786, 0x384F25E3)
	ROUND(18, 6, 7, 0, 1, 2, 3, 4, 5, 0x0FC19DC6, 0x8B8CD5B5)
	ROUND(19, 5, 6, 7, 0, 1, 2, 3, 4, 0x240CA1CC, 0x77AC9C65)
	ROUND(20, 4, 5, 6, 7, 0, 1, 2, 3, 0x2DE92C6F, 0x592B0275)
	ROUND(21, 3, 4, 5, 6, 7, 0, 1, 2, 0x4A7484AA, 0x6EA6E483)
	ROUND(22, 2, 3, 4, 5, 6, 7, 0, 1, 0x5CB0A9DC, 0xBD41FBD4)
	ROUND(23, 1, 2, 3, 4, 5, 6, 7, 0, 0x76F988DA, 0x831153B5)
	ROUND(24, 0, 1, 2, 3, 4, 5, 6, 7, 0x983E5152, 0xEE66DFAB)
	ROUND(25, 7, 0, 1, 2, 3, 4, 5, 6, 0xA831C66D, 0x2DB43210)
	ROUND(26, 6, 7, 0, 1, 2, 3, 4, 5, 0xB00327C8, 0x98FB213F)
	ROUND(27, 5, 6, 7, 0, 1, 2, 3, 4, 0xBF597FC7, 0xBEEF0EE4)
	ROUND(28, 4, 5, 6, 7, 0, 1, 2, 3, 0xC6E00BF3, 0x3DA88FC2)
	ROUND(29, 3, 4, 5, 6, 7, 0, 1, 2, 0xD5A79147, 0x930AA725)
	ROUND(30, 2, 3, 4, 5, 6, 7, 0, 1, 0x06CA6351, 0xE003826F)
	ROUND(31, 1, 2, 3, 4, 5, 6, 7, 0, 0x14292967, 0x0A0E6E70)
	ROUND(32, 0, 1, 2, 3, 4, 5, 6, 7, 0x27B70A85, 0x46D22FFC)
	ROUND(33, 7, 0, 1, 2, 3, 4, 5, 6, 0x2E1B2138, 0x5C26C926)
	ROUND(34, 6, 7, 0, 1, 2, 3, 4, 5, 0x4D2C6DFC, 0x5AC42AED)
	ROUND(35, 5, 6, 7, 0, 1, 2, 3, 4, 0x53380D13, 0x9D95B3DF)
	ROUND(36, 4, 5, 6, 7, 0, 1, 2, 3, 0x650A7354, 0x8BAF63DE)
	ROUND(37, 3, 4, 5, 6, 7, 0, 1, 2, 0x766A0ABB, 0x3C77B2A8)
	ROUND(38, 2, 3, 4, 5, 6, 7, 0, 1, 0x81C2C92E, 0x47EDAEE6)
	ROUND(39, 1, 2, 3, 4, 5, 6, 7, 0, 0x92722C85, 0x1482353B)
	ROUND(40, 0, 1, 2, 3, 4, 5, 6, 7, 0xA2BFE8A1, 0x4CF10364)
	ROUND(41, 7, 0, 1, 2, 3, 4, 5, 6, 0xA81A664B, 0xBC423001)
	ROUND(42, 6, 7, 0, 1, 2, 3, 4, 5, 0xC24B8B70, 0xD0F89791)
	ROUND(43, 5, 6, 7, 0, 1, 2, 3, 4, 0xC76C51A3, 0x0654BE30)
	ROUND(44, 4, 5, 6, 7, 0, 1, 2, 3, 0xD192E819, 0xD6EF5218)
	ROUND(45, 3, 4, 5, 6, 7, 0, 1, 2, 0xD6990624, 0x5565A910)
	ROUND(46, 2, 3, 4, 5, 6, 7, 0, 1, 0xF40E3585, 0x5771202A)
	ROUND(47, 1, 2, 3, 4, 5, 6, 7, 0, 0x106AA070, 0x32BBD1B8)
	ROUND(48, 0, 1, 2, 3, 4, 5, 6, 7, 0x19A4C116, 0xB8D2D0C8)
	ROUND(49, 7, 0, 1, 2, 3, 4, 5, 6, 0x1E376C08, 0x5141AB53)
	ROUND(50, 6, 7, 0, 1, 2, 3, 4, 5, 0x2748774C, 0xDF8EEB99)
	ROUND(51, 5, 6, 7, 0, 1, 2, 3, 4, 0x34B0BCB5, 0xE19B48A8)
	ROUND(52, 4, 5, 6, 7, 0, 1, 2, 3, 0x391C0CB3, 0xC5C95A63)
	ROUND(53, 3, 4, 5, 6, 7, 0, 1, 2, 0x4ED8AA4A, 0xE3418ACB)
	ROUND(54, 2, 3, 4, 5, 6, 7, 0, 1, 0x5B9CCA4F, 0x7763E373)
	ROUND(55, 1, 2, 3, 4, 5, 6, 7, 0, 0x682E6FF3, 0xD6B2B8A3)
	ROUND(56, 0, 1, 2, 3, 4, 5, 6, 7, 0x748F82EE, 0x5DEFB2FC)
	ROUND(57, 7, 0, 1, 2, 3, 4, 5, 6, 0x78A5636F, 0x43172F60)
	ROUND(58, 6, 7, 0, 1, 2, 3, 4, 5, 0x84C87814, 0xA1F0AB72)
	ROUND(59, 5, 6, 7, 0, 1, 2, 3, 4, 0x8CC70208, 0x1A6439EC)
	ROUND(60, 4, 5, 6, 7, 0, 1, 2, 3, 0x90BEFFFA, 0x23631E28)
	ROUND(61, 3, 4, 5, 6, 7, 0, 1, 2, 0xA4506CEB, 0xDE82BDE9)
	ROUND(62, 2, 3, 4, 5, 6, 7, 0, 1, 0xBEF9A3F7, 0xB2C67915)
	ROUND(63, 1, 2, 3, 4, 5, 6, 7, 0, 0xC67178F2, 0xE372532B)
	ROUND(64, 0, 1, 2, 3, 4, 5, 6, 7, 0xCA273ECE, 0xEA26619C)
	ROUND(65, 7, 0, 1, 2, 3, 4, 5, 6, 0xD186B8C7, 0x21C0C207)
	ROUND(66, 6, 7, 0, 1, 2, 3, 4, 5, 0xEADA7DD6, 0xCDE0EB1E)
	ROUND(67, 5, 6, 7, 0, 1, 2, 3, 4, 0xF57D4F7F, 0xEE6ED178)
	ROUND(68, 4, 5, 6, 7, 0, 1, 2, 3, 0x06F067AA, 0x72176FBA)
	ROUND(69, 3, 4, 5, 6, 7, 0, 1, 2, 0x0A637DC5, 0xA2C898A6)
	ROUND(70, 2, 3, 4, 5, 6, 7, 0, 1, 0x113F9804, 0xBEF90DAE)
	ROUND(71, 1, 2, 3, 4, 5, 6, 7, 0, 0x1B710B35, 0x131C471B)
	ROUND(72, 0, 1, 2, 3, 4, 5, 6, 7, 0x28DB77F5, 0x23047D84)
	ROUND(73, 7, 0, 1, 2, 3, 4, 5, 6, 0x32CAAB7B, 0x40C72493)
	ROUND(74, 6, 7, 0, 1, 2, 3, 4, 5, 0x3C9EBE0A, 0x15C9BEBC)
	ROUND(75, 5, 6, 7, 0, 1, 2, 3, 4, 0x431D67C4, 0x9C100D4C)
	ROUND(76, 4, 5, 6, 7, 0, 1, 2, 3, 0x4CC5D4BE, 0xCB3E42B6)
	ROUND(77, 3, 4, 5, 6, 7, 0, 1, 2, 0x597F299C, 0xFC657E2A)
	ROUND(78, 2, 3, 4, 5, 6, 7, 0, 1, 0x5FCB6FAB, 0x3AD6FAEC)
	ROUND(79, 1, 2, 3, 4, 5, 6, 7, 0, 0x6C44198C, 0x4A475817)
	
	/* Add to state */
	movl $0, %ecx
	leal 8(%esp), %esi
	movl 732(%esp), %edi
.addloop:
	movl 0(%esi,%ecx,8), %eax
	movl 4(%esi,%ecx,8), %ebx
	addl %eax, 0(%edi,%ecx,8)
	adcl %ebx, 4(%edi,%ecx,8)
	incl %ecx
	cmpl $8, %ecx
	jb .addloop
	
	/* Restore registers */
	addl $712, %esp
	popl %ebp
	popl %edi
	popl %esi
	popl %ebx
	ret
