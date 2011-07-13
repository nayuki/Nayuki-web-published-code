/*
 * RC4 stream cipher in x86 assembly
 * Copyright (c) 2011 Nayuki Minase
 */


/* void rc4_encrypt_x86(rc4state *state, uint8_t *msg, int len); */
.globl rc4_encrypt_x86
rc4_encrypt_x86:
	/* Enter */
	pushl   %ebp
	movl    %esp, %ebp
	subl    $12, %esp
	
	/* Preserve callee-save registers */
	movl    %ebx, 0(%esp)
	movl    %esi, 4(%esp)
	movl    %edi, 8(%esp)
	
	/* Load arguments */
	movl     8(%ebp), %ecx  /* Address of state struct */
	movl    12(%ebp), %edi  /* Address of message array */
	movl    16(%ebp), %edx  /* Length of message array */
	addl    %edi, %edx      /* Compute end of message array */
	
	/* Load state variables */
	movl    0(%ecx), %eax  /* i */
	movl    4(%ecx), %ebx  /* j */
	leal    8(%ecx), %esi  /* s */
	
	/* Initialize */
	movl    $0, %ecx
	cmpl    %edi, %edx
	je      .rc4_encrypt_bottom
	
.rc4_encrypt_top:
	/* Increment i */
	addl    $1, %eax
	andl    $0xFF, %eax
	
	/* Add to j */
	movzbl  (%esi,%eax), %ecx
	addl    %ecx, %ebx
	andl    $0xFF, %ebx
	
	/* Swap s[i] and s[j] */
	movb    (%esi,%ebx), %ch
	movb    %ch, (%esi,%eax)
	movb    %cl, (%esi,%ebx)
	
	/* Compute key stream byte */
	addb    %ch, %cl
	xorb    %ch, %ch
	movb    (%esi,%ecx), %cl
	
	/* XOR with message */
	xorb    %cl, (%edi)
	
	/* Increment */
	addl    $1, %edi
	cmpl    %edi, %edx
	jne     .rc4_encrypt_top
	
.rc4_encrypt_bottom:
	/* Restore registers */
	movl    0(%esp), %ebx
	movl    4(%esp), %esi
	movl    8(%esp), %edi
	
	/* Exit */
	addl    $12, %esp
	popl    %ebp
	ret
