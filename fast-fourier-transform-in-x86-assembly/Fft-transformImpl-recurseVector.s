/* 
 * Fast Fourier transform
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
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
 *        8  rcx       Size of FFT (i.e. number of elements in the vector) (a power of 2), constant
 *        8  rdi       Base of complex vector array, constant (64-bit floats)
 *        8  rsi       Base of bit reversal array (64-bit ints), then base of complex exponential array (64-bit floats)
 *        8  rax       Loop counter
 *        8  rdx       Temporary, loop counter
 *        8  rbx       Temporary
 *        8  r8        Temporary
 *        8  r9        Temporary
 *        8  r10       Temporary
 *        8  r11       Temporary
 *        8  r12       Temporary
 *      224  ymm0-6    Temporary (64-bit float vectors)
 *       16  xmm7      Temporary (64-bit float vector)
 *       16  xmm8      Negation constants (64-bit float vector)
 *       32  ymm9      Negation constants (64-bit float vector)
 *       16  xmm10     Caller's value of rbx (only low 64 bits are used)
 *       16  xmm11     Caller's value of r12 (only low 64 bits are used)
 */
# void Fft_transformImpl(uint64_t n, const uint64_t *bitReversal, const double *expTable, double *vec)
.globl Fft_transformImpl
Fft_transformImpl:
	# Save registers
	movq  %rbx, %xmm10
	movq  %r12, %xmm11
	
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
	
	
	# Main transform
	vmovapd  .size4negation(%rip), %xmm8
	vmovapd  .generalnegation(%rip), %ymm9
	movq     %r9, %rsi
	movq     $0, %rdx  # i
	
	.outerloop:
		# Two size-2 merges, then one size-4 merge
		vmovupd     0(%rdi,%rdx,8), %xmm0
		vmovupd    16(%rdi,%rdx,8), %xmm1
		vmovupd    32(%rdi,%rdx,8), %xmm2
		vmovupd    48(%rdi,%rdx,8), %xmm3
		vaddpd     %xmm1, %xmm0, %xmm4
		vsubpd     %xmm1, %xmm0, %xmm5
		vaddpd     %xmm3, %xmm2, %xmm6
		vsubpd     %xmm3, %xmm2, %xmm7
		vaddpd     %xmm6, %xmm4, %xmm0
		vsubpd     %xmm6, %xmm4, %xmm2
		vpermilpd  $1, %xmm7, %xmm7
		vxorpd     %xmm7, %xmm8, %xmm7
		vaddpd     %xmm7, %xmm5, %xmm1
		vsubpd     %xmm7, %xmm5, %xmm3
		vmovupd    %xmm0,  0(%rdi,%rdx,8)
		vmovupd    %xmm1, 16(%rdi,%rdx,8)
		vmovupd    %xmm2, 32(%rdi,%rdx,8)
		vmovupd    %xmm3, 48(%rdi,%rdx,8)
		addq       $8, %rdx
		
		# Two size-2 merges, then one size-4 merge
		vmovupd     0(%rdi,%rdx,8), %xmm0
		vmovupd    16(%rdi,%rdx,8), %xmm1
		vmovupd    32(%rdi,%rdx,8), %xmm2
		vmovupd    48(%rdi,%rdx,8), %xmm3
		vaddpd     %xmm1, %xmm0, %xmm4
		vsubpd     %xmm1, %xmm0, %xmm5
		vaddpd     %xmm3, %xmm2, %xmm6
		vsubpd     %xmm3, %xmm2, %xmm7
		vaddpd     %xmm6, %xmm4, %xmm0
		vsubpd     %xmm6, %xmm4, %xmm2
		vpermilpd  $1, %xmm7, %xmm7
		vxorpd     %xmm7, %xmm8, %xmm7
		vaddpd     %xmm7, %xmm5, %xmm1
		vsubpd     %xmm7, %xmm5, %xmm3
		vmovupd    %xmm0,  0(%rdi,%rdx,8)
		vmovupd    %xmm1, 16(%rdi,%rdx,8)
		vmovupd    %xmm2, 32(%rdi,%rdx,8)
		vmovupd    %xmm3, 48(%rdi,%rdx,8)
		addq       $8, %rdx
		
		
		# Size-8 and larger merges
		movq  %rdx, %r10
		shrq  $4, %r10
		leaq  -1(%r10), %r11
		xorq  %r10, %r11  # merges
		movq  %rsi, %r10  # table
		movq  $8, %rbx  # size
		jmp   .middleloop1
		
		.middleloop0:
			shrq  %r11
			leaq  (%r10,%rbx,8), %r10
			shlq  %rbx
			.middleloop1:
			leaq  (,%rbx,8), %r12
			negq  %r12
			leaq  (%rdi,%rdx,8), %r9
			addq  %r12, %r9
			leaq  (%r9,%r12), %r8
			movq  $0, %rax  # j
			
			.innerloop:
				vmovupd      (%r8,%rax,8), %ymm0
				vmovupd      (%r9,%rax,8), %ymm1
				vmovupd      (%r10,%rax,8), %ymm2
				vpermilpd    $15, %ymm2, %ymm3
				vpermilpd    $0 , %ymm2, %ymm2
				vxorpd       %ymm3, %ymm9, %ymm3
				vmulpd       %ymm1, %ymm2, %ymm4
				vpermilpd    $5, %ymm1, %ymm1
				vfmadd231pd  %ymm1, %ymm3, %ymm4
				vaddpd       %ymm4, %ymm0, %ymm5
				vsubpd       %ymm4, %ymm0, %ymm6
				vmovupd      %ymm5, (%r8,%rax,8)
				vmovupd      %ymm6, (%r9,%rax,8)
				
				addq  $4, %rax
				cmpq  %rbx, %rax
				jb    .innerloop
			# End inner loop
			
			cmpq  $1, %r11
			jne   .middleloop0
		# End middle loop
		
		leaq  (%rcx,%rcx), %r8
		cmpq  %r8, %rdx
		jb    .outerloop
	# End outer loop
	
	
	# Clean up
	movq      %xmm10, %rbx
	movq      %xmm11, %r12
	vzeroall
	retq


# Constants for XMM/YMM
.balign 16
.size4negation: .quad 0x0000000000000000, 0x8000000000000000
.balign 32
.generalnegation: .quad 0x8000000000000000, 0x0000000000000000, 0x8000000000000000, 0x0000000000000000
