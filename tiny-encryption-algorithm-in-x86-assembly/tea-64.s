/* 
 * Tiny Encryption Algorithm (TEA) in x86-64 assembly
 * 
 * Copyright (c) 2014 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * http://www.nayuki.io/page/tiny-encryption-algorithm-in-x86-assembly
 */


/* void tea_encrypt_x86(uint32_t msg[2], const uint32_t key[4]) */
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
	 *      16  xmm0      Caller's value of r10 (only lower 64 bits are used)
	 *      16  xmm1      Caller's value of r11 (only lower 64 bits are used)
	 *      16  xmm2      Base address of message array argument (only lower 64 bits are used)
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
