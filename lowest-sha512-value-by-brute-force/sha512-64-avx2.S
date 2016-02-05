/* 
 * Quad SHA-512 hash in x86-64 AVX2 assembly
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/lowest-sha512-value-by-brute-force
 */


/* void sha512_compress_quad(uint64_t states[32], const uint8_t blocks[512]) */
.globl sha512_compress_quad
sha512_compress_quad:
	/* 
	 * Storage usage:
	 *   Bytes  Location  Description
	 *       8  rcx       Stack pointer at function entry
	 *       8  rsi       Base address of block array argument
	 *       8  rdi       Base address of state array argument
	 *       8  rsp       x86-64 stack pointer
	 *     512  [rsp+0]   Circular buffer of most recent 16 key schedule items, 32 bytes each
	 *      32  ymm0      SHA-512 state variable A
	 *      32  ymm1      SHA-512 state variable B
	 *      32  ymm2      SHA-512 state variable C
	 *      32  ymm3      SHA-512 state variable D
	 *      32  ymm4      SHA-512 state variable E
	 *      32  ymm5      SHA-512 state variable F
	 *      32  ymm6      SHA-512 state variable G
	 *      32  ymm7      SHA-512 state variable H
	 *      32  ymm8      Temporary for calculation per round
	 *      32  ymm9      Temporary for calculation per round
	 *      32  ymm10     Temporary for calculation per round
	 *      32  ymm11     Temporary for calculation per round
	 *      32  ymm15     Control value for byte endian reversal
	 */
	
	#define SCHED(i)  (((i)&0xF)*32)(%rsp)
	
	#define ROUNDa(i, a, b, c, d, e, f, g, h)  \
		vmovdqu   (i*32)(%rsi), %ymm8;  \
		vpshufb  %ymm15, %ymm8, %ymm8;  \
		ROUNDTAIL(i, a, b, c, d, e, f, g, h)
	
	#define ROUNDb(i, a, b, c, d, e, f, g, h)  \
		/* ymm10 = schedule[(i - 15) % 16] */  \
		vmovdqa SCHED(i-15), %ymm10;           \
		/* ymm9 = rorq(ymm10, 1) */            \
		vpsrlq  $ 1, %ymm10, %ymm9;            \
		vpsllq  $63, %ymm10, %ymm11;           \
		vpor    %ymm9, %ymm11, %ymm9;          \
		/* ymm9 ^= rorq(ymm10, 8) */           \
		vpsrlq  $ 8, %ymm10, %ymm11;           \
		vpxor   %ymm9, %ymm11, %ymm9;          \
		vpsllq  $56, %ymm10, %ymm11;           \
		vpxor   %ymm9, %ymm11, %ymm9;          \
		/* ymm8 = ymm9 ^ (ymm10 >> 7) */       \
		vpsrlq  $7, %ymm10, %ymm10;            \
		vpxor   %ymm9, %ymm10, %ymm8;          \
		/* ymm10 = schedule[(i - 2) % 16] */   \
		vmovdqa  SCHED(i-2), %ymm10;           \
		/* ymm9 = rorq(ymm10, 19) */           \
		vpsrlq  $19, %ymm10, %ymm9;            \
		vpsllq  $45, %ymm10, %ymm11;           \
		vpor    %ymm9, %ymm11, %ymm9;          \
		/* ymm9 ^= rorq(ymm10, 61) */          \
		vpsrlq  $61, %ymm10, %ymm11;           \
		vpxor   %ymm9, %ymm11, %ymm9;          \
		vpsllq  $ 3, %ymm10, %ymm11;           \
		vpxor   %ymm9, %ymm11, %ymm9;          \
		/* ymm9 ^= (ymm10 >> 6) */             \
		vpsrlq  $6, %ymm10, %ymm10;            \
		vpxor   %ymm9, %ymm10, %ymm9;          \
		/* ymm8 += ymm9 */                     \
		vpaddq  %ymm8, %ymm9, %ymm8;           \
		/* ymm8 += schedule[(i - 16) % 16] */  \
		vmovdqa  SCHED(i-16), %ymm9;           \
		vpaddq  %ymm8, %ymm9, %ymm8;           \
		/* ymm8 += schedule[(i - 7) % 16] */   \
		vmovdqa  SCHED(i-7), %ymm9;            \
		vpaddq  %ymm8, %ymm9, %ymm8;           \
		ROUNDTAIL(i, a, b, c, d, e, f, g, h)
	
	#define ROUNDTAIL(i, a, b, c, d, e, f, g, h)  \
		/* schedule[i % 16] = ymm8 */         \
		vmovdqa   %ymm8, SCHED(i);            \
		/* h += ymm8 */                       \
		vpaddq  %h, %ymm8, %h;                \
		/* ymm8 = rorq(e, 18) */              \
		vpsrlq  $18, %e, %ymm8;               \
		vpsllq  $46, %e, %ymm9;               \
		vpor    %ymm8, %ymm9, %ymm8;          \
		/* ymm8 ^= rorq(e, 41) */             \
		vpsrlq  $41, %e, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		vpsllq  $23, %e, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		/* ymm8 ^= rorq(e, 14) */             \
		vpsrlq  $14, %e, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		vpsllq  $50, %e, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		/* h += ymm8 */                       \
		vpaddq  %h, %ymm8, %h;                \
		/* h += roundconstants[i] */          \
		vpaddq  roundconstants+i*32, %h, %h;  \
		/* ymm8 = g ^ (e & (f ^ g)) */        \
		vpxor   %f, %g, %ymm8;                \
		vpand   %ymm8, %e, %ymm8;             \
		vpxor   %ymm8, %g, %ymm8;             \
		/* h += ymm8 */                       \
		vpaddq  %h, %ymm8, %h;                \
		/* d += h */                          \
		vpaddq  %d, %h, %d;                   \
		/* ymm8 = rorq(a, 28) */              \
		vpsrlq  $28, %a, %ymm8;               \
		vpsllq  $36, %a, %ymm9;               \
		vpor    %ymm8, %ymm9, %ymm8;          \
		/* ymm8 ^= rorq(a, 34) */             \
		vpsrlq  $34, %a, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		vpsllq  $30, %a, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		/* ymm8 ^= rorq(a, 39) */             \
		vpsrlq  $39, %a, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		vpsllq  $25, %a, %ymm9;               \
		vpxor   %ymm8, %ymm9, %ymm8;          \
		/* h += ymm8 */                       \
		vpaddq  %h, %ymm8, %h;                \
		/* ymm8 = b & c */                    \
		vpand   %b, %c, %ymm8;                \
		/* ymm9 = a & (b | c) */              \
		vpor    %b, %c, %ymm9;                \
		vpand   %ymm9, %a, %ymm9;             \
		/* ymm8 = ymm8 | ymm9 */              \
		vpor    %ymm8, %ymm9, %ymm8;          \
		/* h += ymm8 */                       \
		vpaddq  %h, %ymm8, %h
	
	/* Initialize, allocate stack scratch space for schedule */
	movq     %rsp, %rcx
	subq     $512, %rsp
	andq     $~31, %rsp  /* Align to 256 bits */
	vmovdqa  bswap64quad, %ymm15
	
	/* Load state */
	vmovdqu    0(%rdi), %ymm0
	vmovdqu   32(%rdi), %ymm1
	vmovdqu   64(%rdi), %ymm2
	vmovdqu   96(%rdi), %ymm3
	vmovdqu  128(%rdi), %ymm4
	vmovdqu  160(%rdi), %ymm5
	vmovdqu  192(%rdi), %ymm6
	vmovdqu  224(%rdi), %ymm7
	
	/* Do 80 rounds of hashing */
	ROUNDa( 0, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDa( 1, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDa( 2, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDa( 3, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDa( 4, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDa( 5, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDa( 6, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDa( 7, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDa( 8, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDa( 9, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDa(10, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDa(11, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDa(12, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDa(13, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDa(14, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDa(15, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(16, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(17, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(18, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(19, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(20, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(21, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(22, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(23, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(24, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(25, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(26, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(27, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(28, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(29, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(30, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(31, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(32, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(33, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(34, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(35, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(36, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(37, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(38, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(39, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(40, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(41, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(42, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(43, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(44, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(45, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(46, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(47, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(48, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(49, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(50, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(51, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(52, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(53, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(54, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(55, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(56, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(57, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(58, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(59, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(60, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(61, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(62, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(63, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(64, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(65, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(66, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(67, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(68, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(69, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(70, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(71, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	ROUNDb(72, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7)
	ROUNDb(73, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6)
	ROUNDb(74, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4, ymm5)
	ROUNDb(75, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3, ymm4)
	ROUNDb(76, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2, ymm3)
	ROUNDb(77, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1, ymm2)
	ROUNDb(78, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0, ymm1)
	ROUNDb(79, ymm1, ymm2, ymm3, ymm4, ymm5, ymm6, ymm7, ymm0)
	movq     %rcx, %rsp  /* Restore stack */
	
	/* Add to state */
	vpaddq     0(%rdi), %ymm0, %ymm0
	vpaddq    32(%rdi), %ymm1, %ymm1
	vpaddq    64(%rdi), %ymm2, %ymm2
	vpaddq    96(%rdi), %ymm3, %ymm3
	vpaddq   128(%rdi), %ymm4, %ymm4
	vpaddq   160(%rdi), %ymm5, %ymm5
	vpaddq   192(%rdi), %ymm6, %ymm6
	vpaddq   224(%rdi), %ymm7, %ymm7
	vmovdqu  %ymm0,   0(%rdi)
	vmovdqu  %ymm1,  32(%rdi)
	vmovdqu  %ymm2,  64(%rdi)
	vmovdqu  %ymm3,  96(%rdi)
	vmovdqu  %ymm4, 128(%rdi)
	vmovdqu  %ymm5, 160(%rdi)
	vmovdqu  %ymm6, 192(%rdi)
	vmovdqu  %ymm7, 224(%rdi)
	
	retq


/* Constants */

.balign 32
bswap64quad:
	.quad 0x0001020304050607, 0x08090A0B0C0D0E0F, 0x0001020304050607, 0x08090A0B0C0D0E0F

#define QUAD(x)  x, x, x, x
roundconstants:
	.quad QUAD(0x428A2F98D728AE22), QUAD(0x7137449123EF65CD), QUAD(0xB5C0FBCFEC4D3B2F), QUAD(0xE9B5DBA58189DBBC)
	.quad QUAD(0x3956C25BF348B538), QUAD(0x59F111F1B605D019), QUAD(0x923F82A4AF194F9B), QUAD(0xAB1C5ED5DA6D8118)
	.quad QUAD(0xD807AA98A3030242), QUAD(0x12835B0145706FBE), QUAD(0x243185BE4EE4B28C), QUAD(0x550C7DC3D5FFB4E2)
	.quad QUAD(0x72BE5D74F27B896F), QUAD(0x80DEB1FE3B1696B1), QUAD(0x9BDC06A725C71235), QUAD(0xC19BF174CF692694)
	.quad QUAD(0xE49B69C19EF14AD2), QUAD(0xEFBE4786384F25E3), QUAD(0x0FC19DC68B8CD5B5), QUAD(0x240CA1CC77AC9C65)
	.quad QUAD(0x2DE92C6F592B0275), QUAD(0x4A7484AA6EA6E483), QUAD(0x5CB0A9DCBD41FBD4), QUAD(0x76F988DA831153B5)
	.quad QUAD(0x983E5152EE66DFAB), QUAD(0xA831C66D2DB43210), QUAD(0xB00327C898FB213F), QUAD(0xBF597FC7BEEF0EE4)
	.quad QUAD(0xC6E00BF33DA88FC2), QUAD(0xD5A79147930AA725), QUAD(0x06CA6351E003826F), QUAD(0x142929670A0E6E70)
	.quad QUAD(0x27B70A8546D22FFC), QUAD(0x2E1B21385C26C926), QUAD(0x4D2C6DFC5AC42AED), QUAD(0x53380D139D95B3DF)
	.quad QUAD(0x650A73548BAF63DE), QUAD(0x766A0ABB3C77B2A8), QUAD(0x81C2C92E47EDAEE6), QUAD(0x92722C851482353B)
	.quad QUAD(0xA2BFE8A14CF10364), QUAD(0xA81A664BBC423001), QUAD(0xC24B8B70D0F89791), QUAD(0xC76C51A30654BE30)
	.quad QUAD(0xD192E819D6EF5218), QUAD(0xD69906245565A910), QUAD(0xF40E35855771202A), QUAD(0x106AA07032BBD1B8)
	.quad QUAD(0x19A4C116B8D2D0C8), QUAD(0x1E376C085141AB53), QUAD(0x2748774CDF8EEB99), QUAD(0x34B0BCB5E19B48A8)
	.quad QUAD(0x391C0CB3C5C95A63), QUAD(0x4ED8AA4AE3418ACB), QUAD(0x5B9CCA4F7763E373), QUAD(0x682E6FF3D6B2B8A3)
	.quad QUAD(0x748F82EE5DEFB2FC), QUAD(0x78A5636F43172F60), QUAD(0x84C87814A1F0AB72), QUAD(0x8CC702081A6439EC)
	.quad QUAD(0x90BEFFFA23631E28), QUAD(0xA4506CEBDE82BDE9), QUAD(0xBEF9A3F7B2C67915), QUAD(0xC67178F2E372532B)
	.quad QUAD(0xCA273ECEEA26619C), QUAD(0xD186B8C721C0C207), QUAD(0xEADA7DD6CDE0EB1E), QUAD(0xF57D4F7FEE6ED178)
	.quad QUAD(0x06F067AA72176FBA), QUAD(0x0A637DC5A2C898A6), QUAD(0x113F9804BEF90DAE), QUAD(0x1B710B35131C471B)
	.quad QUAD(0x28DB77F523047D84), QUAD(0x32CAAB7B40C72493), QUAD(0x3C9EBE0A15C9BEBC), QUAD(0x431D67C49C100D4C)
	.quad QUAD(0x4CC5D4BECB3E42B6), QUAD(0x597F299CFC657E2A), QUAD(0x5FCB6FAB3AD6FAEC), QUAD(0x6C44198C4A475817)
