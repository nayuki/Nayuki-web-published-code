/* 
 * Fast Fourier transform
 * 
 * Copyright (c) 2020 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-fourier-transform-in-x86-assembly
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


/* 
 * Storage usage:
 *    Bytes  Location  Description
 *        8  rcx       Size of FFT (i.e. number of elements in the vector) (a power of 2), or this times 16
 *        8  rdi       Base of complex vector array, constant (64-bit floats)
 *        8  rsi       Base of bit reversal array (64-bit ints), then base of complex exponential array (64-bit floats)
 *        8  rax       Primary loop counter
 *        8  rdx       Temporary, loop counter
 *        8  r8        Temporary, loop counter
 *        8  r9        Temporary
 *        8  r10       Temporary
 *      224  ymm0-6    Temporary (64-bit float vectors)
 *       16  xmm7      Temporary (64-bit float vector)
 *       32  ymm8      Negation constants (64-bit float vector)
 */

# void Fft_transformImpl(size_t n, const size_t *bitReversal, const double *expTable, double *vec)
.globl Fft_transformImpl
Fft_transformImpl:
	# Permute register names for aesthetics
	xchgq  %rcx, %rdi
	movq   %rdx, %r9
	
	# Bit-reversed addressing permutation
	movq  $0, %rax
	.bitrevloop:
		movq  (%rsi,%rax,8), %rdx
		cmpq  %rdx, %rax
		jae   .bitrevskip
			movq     %rax, %r8
			shlq     $4, %r8
			shlq     $4, %rdx
			vmovupd  (%rdi,%r8 ), %xmm0
			vmovupd  (%rdi,%rdx), %xmm1
			vmovupd  %xmm1, (%rdi,%r8 )
			vmovupd  %xmm0, (%rdi,%rdx)
		.bitrevskip:
		incq  %rax
		cmpq  %rcx, %rax
		jb    .bitrevloop
	
	# Size-2 merge (special)
	shlq  $4, %rcx
	movq  $0, %rax
	.size2loop:
		vmovupd   0(%rdi,%rax), %xmm0
		vmovupd  16(%rdi,%rax), %xmm1
		vaddpd   %xmm1, %xmm0, %xmm2
		vsubpd   %xmm1, %xmm0, %xmm3
		vmovupd  %xmm2,  0(%rdi,%rax)
		vmovupd  %xmm3, 16(%rdi,%rax)
		addq     $32, %rax
		cmpq     %rcx, %rax
		jb       .size2loop
	
	# Size-4 merge (special)
	vmovapd  .size4negation(%rip), %xmm8
	movq     $0, %rax
	.size4loop:
		vmovupd     0(%rdi,%rax), %xmm0
		vmovupd    16(%rdi,%rax), %xmm1
		vmovupd    32(%rdi,%rax), %xmm2
		vmovupd    48(%rdi,%rax), %xmm3
		vaddpd     %xmm2, %xmm0, %xmm4
		vsubpd     %xmm2, %xmm0, %xmm6
		vpermilpd  $1, %xmm3, %xmm3
		vxorpd     %xmm3, %xmm8, %xmm3
		vaddpd     %xmm3, %xmm1, %xmm5
		vsubpd     %xmm3, %xmm1, %xmm7
		vmovupd    %xmm4,  0(%rdi,%rax)
		vmovupd    %xmm5, 16(%rdi,%rax)
		vmovupd    %xmm6, 32(%rdi,%rax)
		vmovupd    %xmm7, 48(%rdi,%rax)
		addq       $64, %rax
		cmpq       %rcx, %rax
		jb         .size4loop
	shrq  $4, %rcx
	
	
	# Size-8 and larger merges (general)
	vmovapd  .generalnegation(%rip), %ymm8
	movq     %r9, %rsi
	movq     $8, %r8
	jmp      .outerloop1
	
	.outerloop0:
		leaq  (%rsi,%r8,8), %rsi  # Advance the trigonometric tables
		shlq  %r8
		.outerloop1:
		movq  $0, %rdx
		
		.middleloop:
			movq  $0, %rax
			
			.innerloop:
				leaq         (%rdx,%rax), %r9
				leaq         (%r9,%r8), %r10
				vmovupd      (%rdi,%r9 ,8), %ymm0
				vmovupd      (%rdi,%r10,8), %ymm1
				vmovupd      (%rsi,%rax,8), %ymm2
				vpermilpd    $15, %ymm2, %ymm3
				vpermilpd    $0 , %ymm2, %ymm2
				vxorpd       %ymm3, %ymm8, %ymm3
				vmulpd       %ymm1, %ymm2, %ymm4
				vpermilpd    $5, %ymm1, %ymm1
				vfmadd231pd  %ymm1, %ymm3, %ymm4
				vaddpd       %ymm4, %ymm0, %ymm5
				vsubpd       %ymm4, %ymm0, %ymm6
				vmovupd      %ymm5, (%rdi,%r9 ,8)
				vmovupd      %ymm6, (%rdi,%r10,8)
				addq         $4, %rax
				cmpq         %r8, %rax
				jb           .innerloop
			# End inner loop
			
			leaq  (%rdx,%r8,2), %rdx
			leaq  (%rcx,%rcx), %r9
			cmpq  %r9, %rdx
			jb    .middleloop
		# End middle loop
		
		cmpq  %rcx, %r8
		jb    .outerloop0
	# End outer loop
	
	
	# Clean up
	vzeroall
	retq


# Constants for XMM/YMM
.balign 16
.size4negation: .quad 0x0000000000000000, 0x8000000000000000
.balign 32
.generalnegation: .quad 0x8000000000000000, 0x0000000000000000, 0x8000000000000000, 0x0000000000000000
