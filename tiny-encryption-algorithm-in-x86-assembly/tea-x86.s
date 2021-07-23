/* 
 * Tiny Encryption Algorithm (TEA) in x86 assembly
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


/* void tea_encrypt_x86(uint32_t msg[static restrict 2], const uint32_t key[static restrict 4]) */
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
