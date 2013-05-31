/* 
 * RC4 stream cipher in x86 assembly
 * 
 * Copyright (c) 2013 Nayuki Minase. All rights reserved.
 * http://nayuki.eigenstate.org/page/rc4-cipher-in-x86-assembly
 */


/* 
 * Storage usage:
 *    Bytes  Location  Description
 *        1  al        Temporary s[i] per round (zero-extended to eax)
 *        1  bl        Temporary s[j] per round (zero-extended to ebx)
 *        1  cl        RC4 state variable i (zero-extended to ecx)
 *        1  dl        RC4 state variable j (zero-extended to edx)
 *        4  esi       Base address of RC4 state array of 256 bytes
 *        4  edi       Address of current message byte to encrypt
 *        4  ebp       End address of message array (msg + len)
 *        4  esp       x86 stack pointer
 *        4  [esp+ 0]  Caller's value of ebx
 *        4  [esp+ 4]  Caller's value of esi
 *        4  [esp+ 8]  Caller's value of edi
 *        4  [esp+12]  Caller's value of ebp
 */

/* void rc4_encrypt_x86(rc4state *state, uint8_t *msg, int len); */
.globl rc4_encrypt_x86
rc4_encrypt_x86:
	/* Preserve callee-save registers */
	subl    $16, %esp
	movl    %ebx,  0(%esp)
	movl    %esi,  4(%esp)
	movl    %edi,  8(%esp)
	movl    %ebp, 12(%esp)
	
	/* Load arguments */
	movl    20(%esp), %esi   /* Address of state struct */
	movl    24(%esp), %edi   /* Address of message array */
	movl    28(%esp), %ebp   /* Length of message array */
	addl    %edi, %ebp       /* End of message array */
	
	/* Load state variables */
	movl    0(%esi), %ecx  /* state->i */
	movl    4(%esi), %edx  /* state->j */
	addl    $8, %esi       /* state->s */
	
	/* Skip loop if len=0 */
	cmpl    %edi, %ebp
	je      .rc4_encrypt_bottom
	
.rc4_encrypt_top:
	/* Increment i mod 256 */
	incl    %ecx
	movzbl  %cl, %ecx  /* Clear upper 24 bits */
	
	/* Add s[i] to j mod 256 */
	movzbl  (%esi,%ecx), %eax  /* Temporary s[i] */
	addb    %al, %dl
	
	/* Swap bytes s[i] and s[j] */
	movzbl  (%esi,%edx), %ebx  /* Temporary s[j] */
	movb    %bl, (%esi,%ecx)
	movb    %al, (%esi,%edx)
	
	/* Compute key stream byte */
	addb    %bl, %al   /* AL = s[i] + s[j] mod 256*/
	movzbl  %al, %eax  /* Prevent partial register access */
	movb    (%esi,%eax), %al
	
	/* XOR with message */
	xorb    %al, (%edi)
	
	/* Increment and loop */
	incl    %edi
	cmpl    %edi, %ebp
	jne     .rc4_encrypt_top
	
.rc4_encrypt_bottom:
	/* Store state variables */
	movl    %ecx, -8(%esi)  /* Save i */
	movl    %edx, -4(%esi)  /* Save j */
	
	/* Restore registers */
	movl     0(%esp), %ebx
	movl     4(%esp), %esi
	movl     8(%esp), %edi
	movl    12(%esp), %ebp
	addl    $16, %esp
	ret
