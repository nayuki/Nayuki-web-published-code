/* 
 * Tiny Encryption Algorithm (TEA) in x86-64 assembly
 * 
 * Copyright (c) 2021 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/tiny-encryption-algorithm-in-x86-assembly
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


/* void tea_encrypt_x86(uint32_t msg[restrict static 2], const uint32_t key[restrict static 4]) */
.globl tea_encrypt_x86
tea_encrypt_x86:
	/* 
	 * Storage usage:
	 *   Bytes  Location  Description
	 *       4  eax       Temporary computed value per subround (zero-extended to rax)
	 *       4  ecx       Temporary computed value per subround (zero-extended to rcx)
	 *       4  edx       Round constant (also serves as loop counter with nonstandard increment) (zero-extended to rdx)
	 *       4  esi       Message word 0 (zero-extended to rsi)
	 *       4  edi       Message word 1 (zero-extended to rdi)
	 *       4  r8d       Key word 0 (read-only) (zero-extended to r8)
	 *       4  r9d       Key word 1 (read-only) (zero-extended to r9)
	 *       4  r10d      Key word 2 (read-only) (zero-extended to r10)
	 *       4  r11d      Key word 3 (read-only) (zero-extended to r11)
	 *       8  rbp       x86 frame pointer
	 *       8  rsp       x86 stack pointer
	 *      16  xmm0      Caller's value of r10 (only low 64 bits are used)
	 *      16  xmm1      Caller's value of r11 (only low 64 bits are used)
	 *      16  xmm2      Base address of message array argument (only low 64 bits are used)
	 */
	
	/* Enter */
	pushq  %rbp
	movq   %rsp, %rbp
	
	/* Preserve callee-save registers */
	movq   %r10, %xmm0
	movq   %r11, %xmm1
	
	/* Load key words */
	movl    0(%rsi), %r8d
	movl    4(%rsi), %r9d
	movl    8(%rsi), %r10d
	movl   12(%rsi), %r11d
	
	/* Load message words */
	movq   %rdi, %xmm2
	movl   0(%rdi), %esi
	movl   4(%rdi), %edi
	
	/* Initialize round constant */
	movl   $0x9E3779B9, %edx  /* 'sum' */
	
.tea_encrypt_top:
	/* Encrypt 0th message word */
	movl   %edi, %ecx
	shll   $4, %ecx
	addl   %r8d, %ecx
	leaq   (%rdi,%rdx), %rax
	xorl   %eax, %ecx
	movl   %edi, %eax
	shrl   $5, %eax
	addl   %r9d, %eax
	xorl   %eax, %ecx
	addl   %ecx, %esi
	
	/* Encrypt 1st message word */
	movl   %esi, %ecx
	shll   $4, %ecx
	addl   %r10d, %ecx
	leaq   (%rsi,%rdx), %rax
	xorl   %eax, %ecx
	movl   %esi, %eax
	shrl   $5, %eax
	addl   %r11d, %eax
	xorl   %eax, %ecx
	addl   %ecx, %edi
	
	/* Increment */
	addl   $0x9E3779B9, %edx
	cmpl   $0x6526B0D9, %edx
	jne    .tea_encrypt_top
	
	/* Store message */
	movq   %xmm2, %rax
	movl   %esi, 0(%rax)
	movl   %edi, 4(%rax)
	
	/* Restore registers */
	movq   %xmm0, %r10
	movq   %xmm1, %r11
	
	/* Exit */
	popq   %rbp
	retq
