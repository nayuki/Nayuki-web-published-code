/*
 * MD5 hash in x86 assembly
 * Copyright (c) 2012 Nayuki Minase
 */


#define ROUND0(a,b,c,d,k,s,t)  \
	movl  %c, %esi;        \
	addl  k(%ebp), %a;     \
	xorl  %d, %esi;        \
	andl  %b, %esi;        \
	xorl  %d, %esi;        \
	leal  t(%esi,%a), %a;  \
	rol   $s, %a;          \
	addl  %b, %a

#define ROUND1(a,b,c,d,k,s,t)  \
	movl  %d, %esi;        \
	movl  %d, %edi;        \
	addl  k(%ebp), %a;     \
	notl  %esi;            \
	andl  %b, %edi;        \
	andl  %c, %esi;        \
	orl   %edi, %esi;      \
	leal  t(%esi,%a), %a;  \
	rol   $s, %a;          \
	addl  %b, %a

#define ROUND2(a,b,c,d,k,s,t)  \
	movl  %c, %esi;        \
	addl  k(%ebp), %a;     \
	xorl  %d, %esi;        \
	xorl  %b, %esi;        \
	leal  t(%esi,%a), %a;  \
	rol   $s, %a;          \
	addl  %b, %a

#define ROUND3(a,b,c,d,k,s,t)  \
	movl  %d, %esi;        \
	not   %esi;            \
	addl  k(%ebp), %a;     \
	orl   %b, %esi;        \
	xorl  %c, %esi;        \
	leal  t(%esi,%a), %a;  \
	rol   $s, %a;          \
	addl  %b, %a


/* void md5_compress_x86(uint32_t *state, uint32_t *block) */
.globl md5_compress_x86
md5_compress_x86:
	/* Save registers */
	subl  $16, %esp
	movl  %ebx,  0(%esp)
	movl  %esi,  4(%esp)
	movl  %edi,  8(%esp)
	movl  %ebp, 12(%esp)
	
	/* Load arguments */
	movl  20(%esp), %esi  /* state */
	movl  24(%esp), %ebp  /* block */
	movl   0(%esi), %eax  /* a */
	movl   4(%esi), %ebx  /* b */
	movl   8(%esi), %ecx  /* c */
	movl  12(%esi), %edx  /* d */
	
	/* 64 rounds of hashing */
	ROUND0(eax, ebx, ecx, edx,  0,  7, 0xD76AA478)
	ROUND0(edx, eax, ebx, ecx,  4, 12, 0xE8C7B756)
	ROUND0(ecx, edx, eax, ebx,  8, 17, 0x242070DB)
	ROUND0(ebx, ecx, edx, eax, 12, 22, 0xC1BDCEEE)
	ROUND0(eax, ebx, ecx, edx, 16,  7, 0xF57C0FAF)
	ROUND0(edx, eax, ebx, ecx, 20, 12, 0x4787C62A)
	ROUND0(ecx, edx, eax, ebx, 24, 17, 0xA8304613)
	ROUND0(ebx, ecx, edx, eax, 28, 22, 0xFD469501)
	ROUND0(eax, ebx, ecx, edx, 32,  7, 0x698098D8)
	ROUND0(edx, eax, ebx, ecx, 36, 12, 0x8B44F7AF)
	ROUND0(ecx, edx, eax, ebx, 40, 17, 0xFFFF5BB1)
	ROUND0(ebx, ecx, edx, eax, 44, 22, 0x895CD7BE)
	ROUND0(eax, ebx, ecx, edx, 48,  7, 0x6B901122)
	ROUND0(edx, eax, ebx, ecx, 52, 12, 0xFD987193)
	ROUND0(ecx, edx, eax, ebx, 56, 17, 0xA679438E)
	ROUND0(ebx, ecx, edx, eax, 60, 22, 0x49B40821)
	ROUND1(eax, ebx, ecx, edx,  4,  5, 0xF61E2562)
	ROUND1(edx, eax, ebx, ecx, 24,  9, 0xC040B340)
	ROUND1(ecx, edx, eax, ebx, 44, 14, 0x265E5A51)
	ROUND1(ebx, ecx, edx, eax,  0, 20, 0xE9B6C7AA)
	ROUND1(eax, ebx, ecx, edx, 20,  5, 0xD62F105D)
	ROUND1(edx, eax, ebx, ecx, 40,  9, 0x02441453)
	ROUND1(ecx, edx, eax, ebx, 60, 14, 0xD8A1E681)
	ROUND1(ebx, ecx, edx, eax, 16, 20, 0xE7D3FBC8)
	ROUND1(eax, ebx, ecx, edx, 36,  5, 0x21E1CDE6)
	ROUND1(edx, eax, ebx, ecx, 56,  9, 0xC33707D6)
	ROUND1(ecx, edx, eax, ebx, 12, 14, 0xF4D50D87)
	ROUND1(ebx, ecx, edx, eax, 32, 20, 0x455A14ED)
	ROUND1(eax, ebx, ecx, edx, 52,  5, 0xA9E3E905)
	ROUND1(edx, eax, ebx, ecx,  8,  9, 0xFCEFA3F8)
	ROUND1(ecx, edx, eax, ebx, 28, 14, 0x676F02D9)
	ROUND1(ebx, ecx, edx, eax, 48, 20, 0x8D2A4C8A)
	ROUND2(eax, ebx, ecx, edx, 20,  4, 0xFFFA3942)
	ROUND2(edx, eax, ebx, ecx, 32, 11, 0x8771F681)
	ROUND2(ecx, edx, eax, ebx, 44, 16, 0x6D9D6122)
	ROUND2(ebx, ecx, edx, eax, 56, 23, 0xFDE5380C)
	ROUND2(eax, ebx, ecx, edx,  4,  4, 0xA4BEEA44)
	ROUND2(edx, eax, ebx, ecx, 16, 11, 0x4BDECFA9)
	ROUND2(ecx, edx, eax, ebx, 28, 16, 0xF6BB4B60)
	ROUND2(ebx, ecx, edx, eax, 40, 23, 0xBEBFBC70)
	ROUND2(eax, ebx, ecx, edx, 52,  4, 0x289B7EC6)
	ROUND2(edx, eax, ebx, ecx,  0, 11, 0xEAA127FA)
	ROUND2(ecx, edx, eax, ebx, 12, 16, 0xD4EF3085)
	ROUND2(ebx, ecx, edx, eax, 24, 23, 0x04881D05)
	ROUND2(eax, ebx, ecx, edx, 36,  4, 0xD9D4D039)
	ROUND2(edx, eax, ebx, ecx, 48, 11, 0xE6DB99E5)
	ROUND2(ecx, edx, eax, ebx, 60, 16, 0x1FA27CF8)
	ROUND2(ebx, ecx, edx, eax,  8, 23, 0xC4AC5665)
	ROUND3(eax, ebx, ecx, edx,  0,  6, 0xF4292244)
	ROUND3(edx, eax, ebx, ecx, 28, 10, 0x432AFF97)
	ROUND3(ecx, edx, eax, ebx, 56, 15, 0xAB9423A7)
	ROUND3(ebx, ecx, edx, eax, 20, 21, 0xFC93A039)
	ROUND3(eax, ebx, ecx, edx, 48,  6, 0x655B59C3)
	ROUND3(edx, eax, ebx, ecx, 12, 10, 0x8F0CCC92)
	ROUND3(ecx, edx, eax, ebx, 40, 15, 0xFFEFF47D)
	ROUND3(ebx, ecx, edx, eax,  4, 21, 0x85845DD1)
	ROUND3(eax, ebx, ecx, edx, 32,  6, 0x6FA87E4F)
	ROUND3(edx, eax, ebx, ecx, 60, 10, 0xFE2CE6E0)
	ROUND3(ecx, edx, eax, ebx, 24, 15, 0xA3014314)
	ROUND3(ebx, ecx, edx, eax, 52, 21, 0x4E0811A1)
	ROUND3(eax, ebx, ecx, edx, 16,  6, 0xF7537E82)
	ROUND3(edx, eax, ebx, ecx, 44, 10, 0xBD3AF235)
	ROUND3(ecx, edx, eax, ebx,  8, 15, 0x2AD7D2BB)
	ROUND3(ebx, ecx, edx, eax, 36, 21, 0xEB86D391)
	
	/* Save updated state */
	movl  20(%esp), %esi
	addl  %eax,  0(%esi)
	addl  %ebx,  4(%esi)
	addl  %ecx,  8(%esi)
	addl  %edx, 12(%esi)
	
	/* Restore registers */
	movl   0(%esp), %ebx
	movl   4(%esp), %esi
	movl   8(%esp), %edi
	movl  12(%esp), %ebp
	addl  $16, %esp
	ret
