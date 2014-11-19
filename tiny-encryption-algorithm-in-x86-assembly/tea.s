/* 
 * Tiny Encryption Algorithm (TEA) in x86 assembly
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
	 *       4  eax       Temporary computed value per subround
	 *       4  ebx       Temporary computed value per subround
	 *       4  ecx       Round constant (also serves as loop counter with nonstandard increment)
	 *       4  edx       Base address of key array argument (read-only)
	 *       4  esi       Message word 0
	 *       4  edi       Message word 1
	 *       4  ebp       x86 frame pointer
	 *       4  esp       x86 stack pointer
	 *       4  [esp+0]   Caller's value of ebx
	 *       4  [esp+4]   Caller's value of esi
	 *       4  [esp+8]   Caller's value of edi
	 */
	
	/* Enter */
	pushl  %ebp
	movl   %esp, %ebp
	subl   $12, %esp
	
	/* Preserve callee-save registers */
	movl   %ebx, 0(%esp)
	movl   %esi, 4(%esp)
	movl   %edi, 8(%esp)
	
	/* Load address of message and key */
	movl    8(%ebp), %eax  /* Message */
	movl   12(%ebp), %edx  /* Key */
	
	/* Load message words */
	movl   0(%eax), %esi
	movl   4(%eax), %edi
	
	/* Initialize round constant */
	movl   $0x9E3779B9, %ecx  /* 'sum' */
	
.tea_encrypt_top:
	/* Encrypt 0th message word */
	movl   %edi, %ebx
	shll   $4, %ebx
	addl   0(%edx), %ebx
	leal   (%edi,%ecx), %eax
	xorl   %eax, %ebx
	movl   %edi, %eax
	shrl   $5, %eax
	addl   4(%edx), %eax
	xorl   %eax, %ebx
	addl   %ebx, %esi
	
	/* Encrypt 1st message word */
	movl   %esi, %ebx
	shll   $4, %ebx
	addl   8(%edx), %ebx
	leal   (%esi,%ecx), %eax
	xorl   %eax, %ebx
	movl   %esi, %eax
	shrl   $5, %eax
	addl   12(%edx), %eax
	xorl   %eax, %ebx
	addl   %ebx, %edi
	
	/* Increment */
	addl   $0x9E3779B9, %ecx
	cmpl   $0x6526B0D9, %ecx
	jne    .tea_encrypt_top
	
	/* Store message */
	movl   8(%ebp), %eax
	movl   %esi, 0(%eax)
	movl   %edi, 4(%eax)
	
	/* Restore registers */
	movl   0(%esp), %ebx
	movl   4(%esp), %esi
	movl   8(%esp), %edi
	
	/* Exit */
	addl   $12, %esp
	popl   %ebp
	retl
