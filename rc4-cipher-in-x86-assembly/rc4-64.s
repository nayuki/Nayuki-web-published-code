/* 
 * RC4 stream cipher in x86-64 assembly
 * 
 * Copyright (c) 2014 Nayuki Minase
 * All rights reserved. Contact Nayuki for licensing.
 * http://nayuki.eigenstate.org/page/rc4-cipher-in-x86-assembly
 */


/* 
 * Storage usage:
 *    Bytes  Location  Description
 *        1  al        Temporary s[i] per round (zero-extended to rax)
 *        1  bl        Temporary s[j] per round (zero-extended to rbx)
 *        1  cl        RC4 state variable i (zero-extended to rcx)
 *        1  dl        RC4 state variable j (zero-extended to rdx)
 *        8  rdi       Base address of RC4 state array of 256 bytes
 *        8  rsi       Address of current message byte to encrypt
 *        8  r8        End address of message array (msg + len)
 *        8  rsp       x86-64 stack pointer
 *        8  [rsp+0]   Caller's value of rbx
 */

/* void rc4_encrypt_x86(rc4state *state, uint8_t *msg, int len); */
.globl rc4_encrypt_x86
rc4_encrypt_x86:
	/* Preserve callee-save registers */
	pushq   %rbx
	
	/* Load arguments */
	leaq    (%rsi,%rdx), %r8  /* End of message array */
	
	/* Load state variables */
	movzbl  0(%rdi), %ecx  /* state->i */
	movzbl  1(%rdi), %edx  /* state->j */
	addq    $2, %rdi       /* state->s */
	
	/* Skip loop if len=0 */
	cmpq    %rsi, %r8
	je      .end
	
.loop:
	/* Increment i mod 256 */
	incl    %ecx
	movzbl  %cl, %ecx  /* Clear upper 24 bits */
	
	/* Add s[i] to j mod 256 */
	movzbl  (%rdi,%rcx), %eax  /* Temporary s[i] */
	addb    %al, %dl
	
	/* Swap bytes s[i] and s[j] */
	movzbl  (%rdi,%rdx), %ebx  /* Temporary s[j] */
	movb    %bl, (%rdi,%rcx)
	movb    %al, (%rdi,%rdx)
	
	/* Compute key stream byte */
	addl    %ebx, %eax  /* AL = s[i] + s[j] mod 256*/
	movzbl  %al, %eax   /* Clear upper 24 bits */
	movb    (%rdi,%rax), %al
	
	/* XOR with message */
	xorb    %al, (%rsi)
	
	/* Increment and loop */
	incq    %rsi
	cmpq    %rsi, %r8
	jne     .loop
	
.end:
	/* Store state variables */
	movb    %cl, -2(%rdi)  /* Save i */
	movb    %dl, -1(%rdi)  /* Save j */
	
	/* Restore registers */
	popq  %rbx
	retq
