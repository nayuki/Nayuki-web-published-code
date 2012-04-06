/*
 * RC4 stream cipher in x86 assembly
 * Copyright (c) 2012 Nayuki Minase
 */


/*
 * Storage usage:
 *    Bytes  Location  Description
 *        1  al        Temporary s[i] per round (sometimes zero-extended to eax)
 *        1  ah        Temporary s[j] per round
 *        1  bl        RC4 state variable i (zero-extended to ebx)
 *        1  cl        RC4 state variable j (zero-extended to ecx)
 *        4  edx       Address of current message byte to encrypt
 *        4  esi       Base address of RC4 state array of 256 bytes
 *        4  edi       End of message array (msg + len)
 *        4  ebp       Unused (retains caller's value)
 *        4  esp       x86 stack pointer
 *        4  [esp+ 0]  Caller's value of ebx
 *        4  [esp+ 4]  Caller's value of esi
 *        4  [esp+ 8]  Caller's value of edi
 */

/* void rc4_encrypt_x86(rc4state *state, uint8_t *msg, int len); */
.globl rc4_encrypt_x86
rc4_encrypt_x86:
	/* Preserve callee-save registers */
	subl    $12, %esp
	movl    %ebx,  0(%esp)
	movl    %esi,  4(%esp)
	movl    %edi,  8(%esp)
	
	/* Load arguments */
	movl    16(%esp), %esi   /* Address of state struct */
	movl    20(%esp), %edx   /* Address of message array */
	movl    24(%esp), %edi   /* Length of message array */
	addl    %edx, %edi       /* End of message array */
	
	/* Load state variables */
	movl    0(%esi), %ebx  /* state->i */
	movl    4(%esi), %ecx  /* state->j */
	addl    $8, %esi       /* state->s */
	
	/* Initialize */
	cmpl    %edx, %edi
	je      .rc4_encrypt_bottom
	
.rc4_encrypt_top:
	/* Increment i mod 256 */
	incl    %ebx
	movzbl  %bl, %ebx  /* Clear upper 24 bits and prevent partial register access */
	
	/* Add s[i] to j mod 256 */
	movb    (%esi,%ebx), %al  /* Temporary s[i] */
	addb    %al, %cl
	
	/* Swap bytes s[i] and s[j] */
	movb    (%esi,%ecx), %ah  /* Temporary s[j] */
	movb    %ah, (%esi,%ebx)
	movb    %al, (%esi,%ecx)
	
	/* Compute key stream byte */
	addb    %ah, %al   /* AL = s[i] + s[j] mod 256*/
	movzbl  %al, %eax  /* Clear upper 24 bits and prevent partial register access */
	movb    (%esi,%eax), %al
	
	/* XOR with message */
	xorb    %al, (%edx)
	
	/* Increment and loop */
	incl    %edx
	cmpl    %edx, %edi
	jne     .rc4_encrypt_top
	
.rc4_encrypt_bottom:
	/* Store state variables */
	movl    %ebx, -8(%esi)  /* Save i */
	movl    %ecx, -4(%esi)  /* Save j */
	
	/* Restore registers */
	movl     0(%esp), %ebx
	movl     4(%esp), %esi
	movl     8(%esp), %edi
	addl    $12, %esp
	ret
