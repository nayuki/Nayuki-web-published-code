/* 
 * Simulated annealing on image demo - auxiliary functions (x86-64)
 * 
 * Copyright (c) 2015 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/simulated-annealing-demo
 */


/* int32_t horizontal_energy_diff_if_swapped(const uint32_t *pixels, uint32_t width, uint32_t height, uint32_t x, uint32_t y) */
.globl horizontal_energy_diff_if_swapped
horizontal_energy_diff_if_swapped:
	/* 
	 * Storage usage:
	 *   Bytes  Location    Description
	 *       8  rdi         Base address of pixels array argument, later becoming pixel address = &pixels[y * width + x]
	 *       4  esi         Width argument (zero-extended to rsi) (read-only)
	 *       4  edx         Height argument (zero-extended to rdx) (read-only)
	 *       4  ecx         X argument (zero-extended to rcx), temporary for calculations
	 *       4  r8d         Y argument (zero-extended to r8), temporary for calculations
	 *       4  r9d         Temporary for calculations (zero-extended to r9)
	 *     128  xmm0..xmm7  Neighboring pixel RGBA values (only low 32 bits are used)
	 *      16  xmm8        Temporary for calculations (only low 32 bits are used)
	 *      16  xmm9        Accumulator for return value (only low 32 bits are used)
	 *       4  eax         Final return value (zero-extended to rax)
	 */
	/* rdi = &pixels[y * width + x] */
	movl    %r8d, %r9d
	imul    %esi, %r9d
	addl    %ecx, %r9d
	leaq    (%rdi,%r9,4), %rdi
	
	/* r9 = -width */
	movl    %esi, %r9d
	negq    %r9
	
	/* Load neighboring pixels */
	movd     0(%rdi)       , %xmm0  /* This pixel        */
	movd     4(%rdi)       , %xmm1  /* Right pixel       */
	movd    -4(%rdi)       , %xmm2  /* Left pixel        */
	movd     8(%rdi)       , %xmm3  /* Right right pixel */
	movd     0(%rdi,%r9 ,4), %xmm4  /* Up pixel          */
	movd     4(%rdi,%r9 ,4), %xmm5  /* Up right pixel    */
	movd     0(%rdi,%rsi,4), %xmm6  /* Down pixel        */
	movd     4(%rdi,%rsi,4), %xmm7  /* Down right pixel  */
	
	pxor    %xmm9, %xmm9  /* Output accumulator */
	
	/* If x > 0 */
	testl   %ecx, %ecx
	jz      .horz0
	movdqa  %xmm2, %xmm8
	psadbw  %xmm0, %xmm2
	psadbw  %xmm1, %xmm8
	psubd   %xmm2, %xmm9
	paddd   %xmm8, %xmm9
	
	/* If x + 2 < width */
	addl    $2, %ecx
	cmpl    %esi, %ecx
	jae     .horz1
.horz0:
	movdqa  %xmm3, %xmm8
	psadbw  %xmm1, %xmm3
	psadbw  %xmm0, %xmm8
	psubd   %xmm3, %xmm9
	paddd   %xmm8, %xmm9
	
	/* If y > 0 */
.horz1:
	testl   %r8d, %r8d
	jz      .horz2
	movdqa  %xmm4, %xmm8
	psadbw  %xmm0, %xmm4
	psadbw  %xmm1, %xmm8
	psubd   %xmm4, %xmm9
	paddd   %xmm8, %xmm9
	movdqa  %xmm5, %xmm8
	psadbw  %xmm1, %xmm5
	psadbw  %xmm0, %xmm8
	psubd   %xmm5, %xmm9
	paddd   %xmm8, %xmm9
	
	/* If y + 1 < height */
	incl    %r8d
	cmpl    %edx, %r8d
	jae     .horz3
.horz2:
	movdqa  %xmm6, %xmm8
	psadbw  %xmm0, %xmm6
	psadbw  %xmm1, %xmm8
	psubd   %xmm6, %xmm9
	paddd   %xmm8, %xmm9
	movdqa  %xmm7, %xmm8
	psadbw  %xmm1, %xmm7
	psadbw  %xmm0, %xmm8
	psubd   %xmm7, %xmm9
	paddd   %xmm8, %xmm9
	
.horz3:
	movd    %xmm9, %eax
	retq


/* int32_t vertical_energy_diff_if_swapped(const uint32_t *pixels, uint32_t width, uint32_t height, uint32_t x, uint32_t y) */
.globl vertical_energy_diff_if_swapped
vertical_energy_diff_if_swapped:
	/* 
	 * Storage usage:
	 *   Bytes  Location    Description
	 *       8  rdi         Base address of pixels array argument, later becoming pixel address = &pixels[y * width + x]
	 *       4  esi         Width argument (zero-extended to rsi) (read-only)
	 *       4  edx         Height argument (zero-extended to rdx) (read-only)
	 *       4  ecx         X argument (zero-extended to rcx), temporary for calculations
	 *       4  r8d         Y argument (zero-extended to r8), temporary for calculations
	 *       4  r9d         Temporary for calculations (zero-extended to r9)
	 *     128  xmm0..xmm7  Neighboring pixel RGBA values (only low 32 bits are used)
	 *      16  xmm8        Temporary for calculations (only low 32 bits are used)
	 *      16  xmm9        Accumulator for return value (only low 32 bits are used)
	 *       4  eax         Final return value (zero-extended to rax)
	 */
	/* rdi = &pixels[y * width + x] */
	movl    %r8d, %r9d
	imul    %esi, %r9d
	addl    %ecx, %r9d
	leaq    (%rdi,%r9,4), %rdi
	
	/* r9 = -width */
	movl    %esi, %r9d
	negq    %r9
	
	/* Load neighboring pixels */
	movd     0(%rdi)       , %xmm0  /* This pixel       */
	movd     0(%rdi,%rsi,4), %xmm1  /* Down pixel       */
	movd     0(%rdi,%r9 ,4), %xmm2  /* Up pixel         */
	movd     0(%rdi,%rsi,8), %xmm3  /* Down down pixel  */
	movd    -4(%rdi)       , %xmm4  /* Left pixel       */
	movd    -4(%rdi,%rsi,4), %xmm5  /* Left down pixel  */
	movd     4(%rdi)       , %xmm6  /* Right pixel      */
	movd     4(%rdi,%rsi,4), %xmm7  /* Right down pixel */
	
	pxor    %xmm9, %xmm9  /* Output accumulator */
	
	/* If y > 0 */
	testl   %r8d, %r8d
	jz      .vert0
	movdqa  %xmm2, %xmm8
	psadbw  %xmm0, %xmm2
	psadbw  %xmm1, %xmm8
	psubd   %xmm2, %xmm9
	paddd   %xmm8, %xmm9
	
	/* If y + 2 < height */
	addl    $2, %r8d
	cmpl    %edx, %r8d
	jae     .vert1
.vert0:
	movdqa  %xmm3, %xmm8
	psadbw  %xmm1, %xmm3
	psadbw  %xmm0, %xmm8
	psubd   %xmm3, %xmm9
	paddd   %xmm8, %xmm9
	
	/* If x > 0 */
.vert1:
	testl   %ecx, %ecx
	jz      .vert2
	movdqa  %xmm4, %xmm8
	psadbw  %xmm0, %xmm4
	psadbw  %xmm1, %xmm8
	psubd   %xmm4, %xmm9
	paddd   %xmm8, %xmm9
	movdqa  %xmm5, %xmm8
	psadbw  %xmm1, %xmm5
	psadbw  %xmm0, %xmm8
	psubd   %xmm5, %xmm9
	paddd   %xmm8, %xmm9
	
	/* If x + 1 < width */
	incl    %ecx
	cmpl    %esi, %ecx
	jae     .vert3
.vert2:
	movdqa  %xmm6, %xmm8
	psadbw  %xmm0, %xmm6
	psadbw  %xmm1, %xmm8
	psubd   %xmm6, %xmm9
	paddd   %xmm8, %xmm9
	movdqa  %xmm7, %xmm8
	psadbw  %xmm1, %xmm7
	psadbw  %xmm0, %xmm8
	psubd   %xmm7, %xmm9
	paddd   %xmm8, %xmm9
	
.vert3:
	movd    %xmm9, %eax
	retq
