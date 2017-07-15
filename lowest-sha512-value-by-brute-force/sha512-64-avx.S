/* 
 * Dual SHA-512 hash in x86-64 AVX assembly
 * 
 * Copyright (c) 2017 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/lowest-sha512-value-by-brute-force
 */


/* void sha512_compress_dual(uint64_t states[8][2], uint8_t blocks[16][2][8]) */
.globl sha512_compress_dual
sha512_compress_dual:
	/* 
	 * Storage usage:
	 *   Bytes  Location  Description
	 *       8  rcx       Stack pointer at function entry
	 *       8  rsi       Base address of block array argument
	 *       8  rdi       Base address of state array argument
	 *       8  rsp       x86-64 stack pointer
	 *     256  [rsp+0]   Circular buffer of most recent 16 key schedule items, 16 bytes each
	 *      16  xmm0      SHA-512 state variable A
	 *      16  xmm1      SHA-512 state variable B
	 *      16  xmm2      SHA-512 state variable C
	 *      16  xmm3      SHA-512 state variable D
	 *      16  xmm4      SHA-512 state variable E
	 *      16  xmm5      SHA-512 state variable F
	 *      16  xmm6      SHA-512 state variable G
	 *      16  xmm7      SHA-512 state variable H
	 *      16  xmm8      Temporary for calculation per round
	 *      16  xmm9      Temporary for calculation per round
	 *      16  xmm10     Temporary for calculation per round
	 *      16  xmm11     Temporary for calculation per round
	 *      16  xmm15     Control value for byte endian reversal
	 */
	
	#define SCHED(i)  (((i)&0xF)*16)(%rsp)
	
	#define ROUNDa(i, a, b, c, d, e, f, g, h)  \
		vmovdqu   (i*16)(%rsi), %xmm8;  \
		vpshufb  %xmm15, %xmm8, %xmm8;  \
		ROUNDTAIL(i, a, b, c, d, e, f, g, h)
	
	#define ROUNDb(i, a, b, c, d, e, f, g, h)  \
		/* xmm10 = schedule[(i - 15) % 16] */  \
		vmovdqa SCHED(i-15), %xmm10;           \
		/* xmm9 = rorq(xmm10, 1) */            \
		vpsrlq  $ 1, %xmm10, %xmm9;            \
		vpsllq  $63, %xmm10, %xmm11;           \
		vpor    %xmm9, %xmm11, %xmm9;          \
		/* xmm9 ^= rorq(xmm10, 8) */           \
		vpsrlq  $ 8, %xmm10, %xmm11;           \
		vpxor   %xmm9, %xmm11, %xmm9;          \
		vpsllq  $56, %xmm10, %xmm11;           \
		vpxor   %xmm9, %xmm11, %xmm9;          \
		/* xmm8 = xmm9 ^ (xmm10 >> 7) */       \
		vpsrlq  $7, %xmm10, %xmm10;            \
		vpxor   %xmm9, %xmm10, %xmm8;          \
		/* xmm10 = schedule[(i - 2) % 16] */   \
		vmovdqa  SCHED(i-2), %xmm10;           \
		/* xmm9 = rorq(xmm10, 19) */           \
		vpsrlq  $19, %xmm10, %xmm9;            \
		vpsllq  $45, %xmm10, %xmm11;           \
		vpor    %xmm9, %xmm11, %xmm9;          \
		/* xmm9 ^= rorq(xmm10, 61) */          \
		vpsrlq  $61, %xmm10, %xmm11;           \
		vpxor   %xmm9, %xmm11, %xmm9;          \
		vpsllq  $ 3, %xmm10, %xmm11;           \
		vpxor   %xmm9, %xmm11, %xmm9;          \
		/* xmm9 ^= (xmm10 >> 6) */             \
		vpsrlq  $6, %xmm10, %xmm10;            \
		vpxor   %xmm9, %xmm10, %xmm9;          \
		/* xmm8 += xmm9 */                     \
		vpaddq  %xmm8, %xmm9, %xmm8;           \
		/* xmm8 += schedule[(i - 16) % 16] */  \
		vmovdqa  SCHED(i-16), %xmm9;           \
		vpaddq  %xmm8, %xmm9, %xmm8;           \
		/* xmm8 += schedule[(i - 7) % 16] */   \
		vmovdqa  SCHED(i-7), %xmm9;            \
		vpaddq  %xmm8, %xmm9, %xmm8;           \
		ROUNDTAIL(i, a, b, c, d, e, f, g, h)
	
	#define ROUNDTAIL(i, a, b, c, d, e, f, g, h)  \
		/* schedule[i % 16] = xmm8 */         \
		vmovdqa   %xmm8, SCHED(i);            \
		/* h += xmm8 */                       \
		vpaddq  %h, %xmm8, %h;                \
		/* xmm8 = rorq(e, 18) */              \
		vpsrlq  $18, %e, %xmm8;               \
		vpsllq  $46, %e, %xmm9;               \
		vpor    %xmm8, %xmm9, %xmm8;          \
		/* xmm8 ^= rorq(e, 41) */             \
		vpsrlq  $41, %e, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		vpsllq  $23, %e, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		/* xmm8 ^= rorq(e, 14) */             \
		vpsrlq  $14, %e, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		vpsllq  $50, %e, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		/* h += xmm8 */                       \
		vpaddq  %h, %xmm8, %h;                \
		/* h += roundconstants[i] */          \
		vpaddq  (.roundconstants+i*16)(%rip), %h, %h;  \
		/* xmm8 = g ^ (e & (f ^ g)) */        \
		vpxor   %f, %g, %xmm8;                \
		vpand   %xmm8, %e, %xmm8;             \
		vpxor   %xmm8, %g, %xmm8;             \
		/* h += xmm8 */                       \
		vpaddq  %h, %xmm8, %h;                \
		/* d += h */                          \
		vpaddq  %d, %h, %d;                   \
		/* xmm8 = rorq(a, 28) */              \
		vpsrlq  $28, %a, %xmm8;               \
		vpsllq  $36, %a, %xmm9;               \
		vpor    %xmm8, %xmm9, %xmm8;          \
		/* xmm8 ^= rorq(a, 34) */             \
		vpsrlq  $34, %a, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		vpsllq  $30, %a, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		/* xmm8 ^= rorq(a, 39) */             \
		vpsrlq  $39, %a, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		vpsllq  $25, %a, %xmm9;               \
		vpxor   %xmm8, %xmm9, %xmm8;          \
		/* h += xmm8 */                       \
		vpaddq  %h, %xmm8, %h;                \
		/* xmm8 = b & c */                    \
		vpand   %b, %c, %xmm8;                \
		/* xmm9 = a & (b | c) */              \
		vpor    %b, %c, %xmm9;                \
		vpand   %xmm9, %a, %xmm9;             \
		/* xmm8 = xmm8 | xmm9 */              \
		vpor    %xmm8, %xmm9, %xmm8;          \
		/* h += xmm8 */                       \
		vpaddq  %h, %xmm8, %h
	
	/* Initialize, allocate stack scratch space for schedule */
	movq     %rsp, %rcx
	subq     $256, %rsp
	andq     $~15, %rsp  /* Align to 128 bits */
	vmovdqa  .bswap64dual(%rip), %xmm15
	
	/* Load state */
	vmovdqu    0(%rdi), %xmm0
	vmovdqu   16(%rdi), %xmm1
	vmovdqu   32(%rdi), %xmm2
	vmovdqu   48(%rdi), %xmm3
	vmovdqu   64(%rdi), %xmm4
	vmovdqu   80(%rdi), %xmm5
	vmovdqu   96(%rdi), %xmm6
	vmovdqu  112(%rdi), %xmm7
	
	/* Do 80 rounds of hashing */
	ROUNDa( 0, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDa( 1, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDa( 2, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDa( 3, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDa( 4, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDa( 5, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDa( 6, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDa( 7, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDa( 8, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDa( 9, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDa(10, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDa(11, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDa(12, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDa(13, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDa(14, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDa(15, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(16, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(17, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(18, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(19, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(20, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(21, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(22, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(23, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(24, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(25, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(26, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(27, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(28, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(29, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(30, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(31, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(32, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(33, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(34, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(35, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(36, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(37, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(38, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(39, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(40, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(41, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(42, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(43, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(44, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(45, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(46, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(47, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(48, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(49, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(50, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(51, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(52, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(53, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(54, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(55, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(56, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(57, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(58, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(59, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(60, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(61, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(62, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(63, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(64, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(65, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(66, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(67, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(68, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(69, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(70, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(71, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	ROUNDb(72, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7)
	ROUNDb(73, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6)
	ROUNDb(74, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4, xmm5)
	ROUNDb(75, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3, xmm4)
	ROUNDb(76, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2, xmm3)
	ROUNDb(77, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1, xmm2)
	ROUNDb(78, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0, xmm1)
	ROUNDb(79, xmm1, xmm2, xmm3, xmm4, xmm5, xmm6, xmm7, xmm0)
	movq     %rcx, %rsp  /* Restore stack */
	
	/* Add to state */
	vpaddq     0(%rdi), %xmm0, %xmm0
	vpaddq    16(%rdi), %xmm1, %xmm1
	vpaddq    32(%rdi), %xmm2, %xmm2
	vpaddq    48(%rdi), %xmm3, %xmm3
	vpaddq    64(%rdi), %xmm4, %xmm4
	vpaddq    80(%rdi), %xmm5, %xmm5
	vpaddq    96(%rdi), %xmm6, %xmm6
	vpaddq   112(%rdi), %xmm7, %xmm7
	vmovdqu  %xmm0,   0(%rdi)
	vmovdqu  %xmm1,  16(%rdi)
	vmovdqu  %xmm2,  32(%rdi)
	vmovdqu  %xmm3,  48(%rdi)
	vmovdqu  %xmm4,  64(%rdi)
	vmovdqu  %xmm5,  80(%rdi)
	vmovdqu  %xmm6,  96(%rdi)
	vmovdqu  %xmm7, 112(%rdi)
	
	vzeroupper
	retq


/* Constants */

.balign 16
.bswap64dual:
	.quad 0x0001020304050607, 0x08090A0B0C0D0E0F

#define DUAL(x)  x, x
.roundconstants:
	.quad DUAL(0x428A2F98D728AE22), DUAL(0x7137449123EF65CD), DUAL(0xB5C0FBCFEC4D3B2F), DUAL(0xE9B5DBA58189DBBC)
	.quad DUAL(0x3956C25BF348B538), DUAL(0x59F111F1B605D019), DUAL(0x923F82A4AF194F9B), DUAL(0xAB1C5ED5DA6D8118)
	.quad DUAL(0xD807AA98A3030242), DUAL(0x12835B0145706FBE), DUAL(0x243185BE4EE4B28C), DUAL(0x550C7DC3D5FFB4E2)
	.quad DUAL(0x72BE5D74F27B896F), DUAL(0x80DEB1FE3B1696B1), DUAL(0x9BDC06A725C71235), DUAL(0xC19BF174CF692694)
	.quad DUAL(0xE49B69C19EF14AD2), DUAL(0xEFBE4786384F25E3), DUAL(0x0FC19DC68B8CD5B5), DUAL(0x240CA1CC77AC9C65)
	.quad DUAL(0x2DE92C6F592B0275), DUAL(0x4A7484AA6EA6E483), DUAL(0x5CB0A9DCBD41FBD4), DUAL(0x76F988DA831153B5)
	.quad DUAL(0x983E5152EE66DFAB), DUAL(0xA831C66D2DB43210), DUAL(0xB00327C898FB213F), DUAL(0xBF597FC7BEEF0EE4)
	.quad DUAL(0xC6E00BF33DA88FC2), DUAL(0xD5A79147930AA725), DUAL(0x06CA6351E003826F), DUAL(0x142929670A0E6E70)
	.quad DUAL(0x27B70A8546D22FFC), DUAL(0x2E1B21385C26C926), DUAL(0x4D2C6DFC5AC42AED), DUAL(0x53380D139D95B3DF)
	.quad DUAL(0x650A73548BAF63DE), DUAL(0x766A0ABB3C77B2A8), DUAL(0x81C2C92E47EDAEE6), DUAL(0x92722C851482353B)
	.quad DUAL(0xA2BFE8A14CF10364), DUAL(0xA81A664BBC423001), DUAL(0xC24B8B70D0F89791), DUAL(0xC76C51A30654BE30)
	.quad DUAL(0xD192E819D6EF5218), DUAL(0xD69906245565A910), DUAL(0xF40E35855771202A), DUAL(0x106AA07032BBD1B8)
	.quad DUAL(0x19A4C116B8D2D0C8), DUAL(0x1E376C085141AB53), DUAL(0x2748774CDF8EEB99), DUAL(0x34B0BCB5E19B48A8)
	.quad DUAL(0x391C0CB3C5C95A63), DUAL(0x4ED8AA4AE3418ACB), DUAL(0x5B9CCA4F7763E373), DUAL(0x682E6FF3D6B2B8A3)
	.quad DUAL(0x748F82EE5DEFB2FC), DUAL(0x78A5636F43172F60), DUAL(0x84C87814A1F0AB72), DUAL(0x8CC702081A6439EC)
	.quad DUAL(0x90BEFFFA23631E28), DUAL(0xA4506CEBDE82BDE9), DUAL(0xBEF9A3F7B2C67915), DUAL(0xC67178F2E372532B)
	.quad DUAL(0xCA273ECEEA26619C), DUAL(0xD186B8C721C0C207), DUAL(0xEADA7DD6CDE0EB1E), DUAL(0xF57D4F7FEE6ED178)
	.quad DUAL(0x06F067AA72176FBA), DUAL(0x0A637DC5A2C898A6), DUAL(0x113F9804BEF90DAE), DUAL(0x1B710B35131C471B)
	.quad DUAL(0x28DB77F523047D84), DUAL(0x32CAAB7B40C72493), DUAL(0x3C9EBE0A15C9BEBC), DUAL(0x431D67C49C100D4C)
	.quad DUAL(0x4CC5D4BECB3E42B6), DUAL(0x597F299CFC657E2A), DUAL(0x5FCB6FAB3AD6FAEC), DUAL(0x6C44198C4A475817)
