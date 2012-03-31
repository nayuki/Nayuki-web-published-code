/*
 * SHA-1 hash in x86 assembly
 * Copyright (c) 2012 Nayuki Minase
 */


/*
 * Storage usage:
 *   Bytes  Location   Description
 *       4  eax        SHA-1 state variable A
 *       4  ebx        SHA-1 state variable B
 *       4  ecx        SHA-1 state variable C
 *       4  edx        SHA-1 state variable D
 *       4  ebp        SHA-1 state variable E
 *       4  esi        Temporary for calculation per round
 *       4  edi        (During key schedule rounds) base address of block array argument (read-only); (during hash rounds) temporary for calculation per round
 *       4  esp        x86 stack pointer
 *     320  [esp+  0]  Key schedule of 80 x 4 bytes
 *       4  [esp+320]  Caller's value of ebp
 *       4  [esp+324]  Caller's value of edi
 *       4  [esp+328]  Caller's value of esi
 *       4  [esp+332]  Caller's value of ebx
 */

#define LOADSCHEDULE(i)  \
	movl    (i*4)(%edi), %esi;  \
	bswapl  %esi;               \
	movl    %esi, (i*4)(%esp)

#define SCHEDULE(i)  \
	movl  ((i- 3)*4)(%esp), %esi;  \
	xorl  ((i- 8)*4)(%esp), %esi;  \
	xorl  ((i-14)*4)(%esp), %esi;  \
	xorl  ((i-16)*4)(%esp), %esi;  \
	roll  $1, %esi;                \
	movl  %esi, (i*4)(%esp)

#define ROUND0(a,b,c,d,e,i)  \
	movl  %c, %esi;  \
	xorl  %d, %esi;  \
	andl  %b, %esi;  \
	xorl  %d, %esi;  \
	ROUNDTAIL(a,b,e,i,0x5A827999)

#define ROUND1(a,b,c,d,e,i)  \
	movl  %b, %esi;  \
	xorl  %c, %esi;  \
	xorl  %d, %esi;  \
	ROUNDTAIL(a,b,e,i,0x6ED9EBA1)

#define ROUND2(a,b,c,d,e,i)  \
	movl  %c, %esi;    \
	orl   %d, %esi;    \
	andl  %b, %esi;    \
	movl  %c, %edi;    \
	andl  %d, %edi;    \
	orl   %edi, %esi;  \
	ROUNDTAIL(a,b,e,i,0x8F1BBCDC)

#define ROUND3(a,b,c,d,e,i)  \
	movl  %b, %esi;  \
	xorl  %c, %esi;  \
	xorl  %d, %esi;  \
	ROUNDTAIL(a,b,e,i,0xCA62C1D6)

#define ROUNDTAIL(a,b,e,i,k)  \
	addl  %esi, %e;         \
	movl  %a, %edi;         \
	roll  $5, %edi;         \
	addl  %edi, %e;         \
	addl  (i*4)(%esp), %e;  \
	addl  $k, %e;           \
	roll  $30, %b


/* void sha1_compress(uint32_t *state, uint32_t *block) */
.globl sha1_compress
sha1_compress:
	/* Save registers */
	pushl   %ebx
	pushl   %esi
	pushl   %edi
	pushl   %ebp
	
	/* Load arguments */
	movl    20(%esp), %esi  /* state */
	movl    24(%esp), %edi  /* block */
	movl     0(%esi), %eax  /* a */
	movl     4(%esi), %ebx  /* b */
	movl     8(%esi), %ecx  /* c */
	movl    12(%esi), %edx  /* d */
	movl    16(%esi), %ebp  /* e */
	
	/* 80 words of key schedule */
	subl    $320, %esp
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
	
	/* 80 rounds of hashing */
	ROUND0(eax, ebx, ecx, edx, ebp,  0)
	ROUND0(ebp, eax, ebx, ecx, edx,  1)
	ROUND0(edx, ebp, eax, ebx, ecx,  2)
	ROUND0(ecx, edx, ebp, eax, ebx,  3)
	ROUND0(ebx, ecx, edx, ebp, eax,  4)
	ROUND0(eax, ebx, ecx, edx, ebp,  5)
	ROUND0(ebp, eax, ebx, ecx, edx,  6)
	ROUND0(edx, ebp, eax, ebx, ecx,  7)
	ROUND0(ecx, edx, ebp, eax, ebx,  8)
	ROUND0(ebx, ecx, edx, ebp, eax,  9)
	ROUND0(eax, ebx, ecx, edx, ebp, 10)
	ROUND0(ebp, eax, ebx, ecx, edx, 11)
	ROUND0(edx, ebp, eax, ebx, ecx, 12)
	ROUND0(ecx, edx, ebp, eax, ebx, 13)
	ROUND0(ebx, ecx, edx, ebp, eax, 14)
	ROUND0(eax, ebx, ecx, edx, ebp, 15)
	ROUND0(ebp, eax, ebx, ecx, edx, 16)
	ROUND0(edx, ebp, eax, ebx, ecx, 17)
	ROUND0(ecx, edx, ebp, eax, ebx, 18)
	ROUND0(ebx, ecx, edx, ebp, eax, 19)
	ROUND1(eax, ebx, ecx, edx, ebp, 20)
	ROUND1(ebp, eax, ebx, ecx, edx, 21)
	ROUND1(edx, ebp, eax, ebx, ecx, 22)
	ROUND1(ecx, edx, ebp, eax, ebx, 23)
	ROUND1(ebx, ecx, edx, ebp, eax, 24)
	ROUND1(eax, ebx, ecx, edx, ebp, 25)
	ROUND1(ebp, eax, ebx, ecx, edx, 26)
	ROUND1(edx, ebp, eax, ebx, ecx, 27)
	ROUND1(ecx, edx, ebp, eax, ebx, 28)
	ROUND1(ebx, ecx, edx, ebp, eax, 29)
	ROUND1(eax, ebx, ecx, edx, ebp, 30)
	ROUND1(ebp, eax, ebx, ecx, edx, 31)
	ROUND1(edx, ebp, eax, ebx, ecx, 32)
	ROUND1(ecx, edx, ebp, eax, ebx, 33)
	ROUND1(ebx, ecx, edx, ebp, eax, 34)
	ROUND1(eax, ebx, ecx, edx, ebp, 35)
	ROUND1(ebp, eax, ebx, ecx, edx, 36)
	ROUND1(edx, ebp, eax, ebx, ecx, 37)
	ROUND1(ecx, edx, ebp, eax, ebx, 38)
	ROUND1(ebx, ecx, edx, ebp, eax, 39)
	ROUND2(eax, ebx, ecx, edx, ebp, 40)
	ROUND2(ebp, eax, ebx, ecx, edx, 41)
	ROUND2(edx, ebp, eax, ebx, ecx, 42)
	ROUND2(ecx, edx, ebp, eax, ebx, 43)
	ROUND2(ebx, ecx, edx, ebp, eax, 44)
	ROUND2(eax, ebx, ecx, edx, ebp, 45)
	ROUND2(ebp, eax, ebx, ecx, edx, 46)
	ROUND2(edx, ebp, eax, ebx, ecx, 47)
	ROUND2(ecx, edx, ebp, eax, ebx, 48)
	ROUND2(ebx, ecx, edx, ebp, eax, 49)
	ROUND2(eax, ebx, ecx, edx, ebp, 50)
	ROUND2(ebp, eax, ebx, ecx, edx, 51)
	ROUND2(edx, ebp, eax, ebx, ecx, 52)
	ROUND2(ecx, edx, ebp, eax, ebx, 53)
	ROUND2(ebx, ecx, edx, ebp, eax, 54)
	ROUND2(eax, ebx, ecx, edx, ebp, 55)
	ROUND2(ebp, eax, ebx, ecx, edx, 56)
	ROUND2(edx, ebp, eax, ebx, ecx, 57)
	ROUND2(ecx, edx, ebp, eax, ebx, 58)
	ROUND2(ebx, ecx, edx, ebp, eax, 59)
	ROUND3(eax, ebx, ecx, edx, ebp, 60)
	ROUND3(ebp, eax, ebx, ecx, edx, 61)
	ROUND3(edx, ebp, eax, ebx, ecx, 62)
	ROUND3(ecx, edx, ebp, eax, ebx, 63)
	ROUND3(ebx, ecx, edx, ebp, eax, 64)
	ROUND3(eax, ebx, ecx, edx, ebp, 65)
	ROUND3(ebp, eax, ebx, ecx, edx, 66)
	ROUND3(edx, ebp, eax, ebx, ecx, 67)
	ROUND3(ecx, edx, ebp, eax, ebx, 68)
	ROUND3(ebx, ecx, edx, ebp, eax, 69)
	ROUND3(eax, ebx, ecx, edx, ebp, 70)
	ROUND3(ebp, eax, ebx, ecx, edx, 71)
	ROUND3(edx, ebp, eax, ebx, ecx, 72)
	ROUND3(ecx, edx, ebp, eax, ebx, 73)
	ROUND3(ebx, ecx, edx, ebp, eax, 74)
	ROUND3(eax, ebx, ecx, edx, ebp, 75)
	ROUND3(ebp, eax, ebx, ecx, edx, 76)
	ROUND3(edx, ebp, eax, ebx, ecx, 77)
	ROUND3(ecx, edx, ebp, eax, ebx, 78)
	ROUND3(ebx, ecx, edx, ebp, eax, 79)
	
	addl    $320, %esp
	
	/* Save updated state */
	movl    20(%esp), %esi
	addl    %eax,  0(%esi)
	addl    %ebx,  4(%esi)
	addl    %ecx,  8(%esi)
	addl    %edx, 12(%esi)
	addl    %ebp, 16(%esi)
	
	/* Restore registers */
	popl    %ebp
	popl    %edi
	popl    %esi
	popl    %ebx
	ret
