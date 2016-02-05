/* 
 * RC4 stream cipher in x86 assembly
 * 
 * Copyright (c) 2014 Project Nayuki
 * https://www.nayuki.io/page/rc4-cipher-in-x86-assembly
 * 
 * (MIT License)
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


/* void rc4_encrypt_x86(Rc4State *state, uint8_t *msg, size_t len) */
.globl rc4_encrypt_x86
rc4_encrypt_x86:
	/* 
	 * Storage usage:
	 *   Bytes  Location  Description
	 *       1  al        Temporary s[i] per round (zero-extended to eax)
	 *       1  bl        Temporary s[j] per round (zero-extended to ebx)
	 *       1  cl        RC4 state variable i (zero-extended to ecx)
	 *       1  dl        RC4 state variable j (zero-extended to edx)
	 *       4  edi       Base address of RC4 state array of 256 bytes
	 *       4  esi       Address of current message byte to encrypt
	 *       4  ebp       End address of message array (msg + len)
	 *       4  esp       x86 stack pointer
	 *       4  [esp+ 0]  Caller's value of ebx
	 *       4  [esp+ 4]  Caller's value of edi
	 *       4  [esp+ 8]  Caller's value of esi
	 *       4  [esp+12]  Caller's value of ebp
	 */
	
	/* Preserve callee-save registers */
	subl    $16, %esp
	movl    %ebx,  0(%esp)
	movl    %edi,  4(%esp)
	movl    %esi,  8(%esp)
	movl    %ebp, 12(%esp)
	
	/* Load arguments */
	movl    20(%esp), %edi   /* Address of state struct */
	movl    24(%esp), %esi   /* Address of message array */
	movl    28(%esp), %ebp   /* Length of message array */
	addl    %esi, %ebp       /* End of message array */
	
	/* Load state variables */
	movzbl  0(%edi), %ecx  /* state->i */
	movzbl  1(%edi), %edx  /* state->j */
	addl    $2, %edi       /* state->s */
	
	/* Skip loop if len=0 */
	cmpl    %esi, %ebp
	je      .end
	
.loop:
	/* Increment i mod 256 */
	incl    %ecx
	movzbl  %cl, %ecx  /* Clear upper 24 bits */
	
	/* Add s[i] to j mod 256 */
	movzbl  (%edi,%ecx), %eax  /* Temporary s[i] */
	addb    %al, %dl
	
	/* Swap bytes s[i] and s[j] */
	movzbl  (%edi,%edx), %ebx  /* Temporary s[j] */
	movb    %bl, (%edi,%ecx)
	movb    %al, (%edi,%edx)
	
	/* Compute key stream byte */
	addl    %ebx, %eax  /* AL = s[i] + s[j] mod 256*/
	movzbl  %al, %eax   /* Clear upper 24 bits */
	movb    (%edi,%eax), %al
	
	/* XOR with message */
	xorb    %al, (%esi)
	
	/* Increment and loop */
	incl    %esi
	cmpl    %esi, %ebp
	jne     .loop
	
.end:
	/* Store state variables */
	movb    %cl, -2(%edi)  /* Save i */
	movb    %dl, -1(%edi)  /* Save j */
	
	/* Restore registers */
	movl     0(%esp), %ebx
	movl     4(%esp), %edi
	movl     8(%esp), %esi
	movl    12(%esp), %ebp
	addl    $16, %esp
	retl
