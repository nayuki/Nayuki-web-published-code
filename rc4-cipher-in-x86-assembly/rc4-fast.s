/*
 * RC4 stream cipher in x86 assembly
 * Copyright (c) 2012 Nayuki Minase
 */


/* void rc4_encrypt_x86(rc4state *state, uint8_t *msg, int len); */
.globl rc4_encrypt_x86
rc4_encrypt_x86:
	/* Enter */
	pushl   %ebp
	movl    %esp, %ebp
	subl    $16, %esp
	
	/* Preserve callee-save registers */
	movl    %ebx, - 4(%ebp)
	movl    %esi, - 8(%ebp)
	movl    %edi, -12(%ebp)
	
	/* Load arguments */
	movl     8(%ebp), %esi   /* Address of state struct */
	movl    12(%ebp), %edi   /* EDI: Address of message array */
	movl    16(%ebp), %edx   /* Length of message array */
	addl    %edi, %edx       /* Compute end of message array */
	movl    %edx, -16(%ebp)  /* Store end of message array to free up a register */
	
	/* Load state variables */
	movl    0(%esi), %eax  /* EAX: i */
	movl    4(%esi), %ebx  /* EBX: j */
	addl    $8, %esi       /* ESI: s */
	
	/* Initialize */
	cmpl    %edi, %edx  /* Note: EDX will be repurposed below */
	je      .rc4_encrypt_bottom
	
.rc4_encrypt_top:
	/* Increment i mod 256 */
	incl    %eax
	andl    $0xFF, %eax
	
	/* Add s[i] to j mod 256 */
	movzbl  (%esi,%eax), %ecx  /* ECX: Temporary s[i] */
	addl    %ecx, %ebx
	andl    $0xFF, %ebx
	
	/* Swap bytes s[i] and s[j] */
	movzbl  (%esi,%ebx), %edx  /* EDX: Temporary s[j] */
	movb    %dl, (%esi,%eax)
	movb    %cl, (%esi,%ebx)
	
	/* Compute key stream byte */
	addl    %edx, %ecx
	andl    $0xFF, %ecx
	movzbl  (%esi,%ecx), %ecx
	
	/* XOR with message */
	xorb    %cl, (%edi)
	
	/* Increment and loop */
	incl    %edi
	cmpl    %edi, -16(%ebp)
	jne     .rc4_encrypt_top
	
.rc4_encrypt_bottom:
	/* Store state variables */
	subl    $8, %esi       /* state */
	movl    %eax, 0(%esi)  /* Save i */
	movl    %ebx, 4(%esi)  /* Save j */
	
	/* Restore registers */
	movl    - 4(%ebp), %ebx
	movl    - 8(%ebp), %esi
	movl    -12(%ebp), %edi
	
	/* Exit */
	addl    $16, %esp
	popl    %ebp
	ret
