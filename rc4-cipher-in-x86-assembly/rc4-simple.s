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
	movl     8(%ebp), %esi  /* Address of state struct */
	movl    12(%ebp), %edi  /* EDI: Address of message array */
	movl    16(%ebp), %edx  /* Length of message array */
	addl    %edi, %edx      /* EDX: Compute end of message array */
	
	/* Load state variables */
	movl    0(%esi), %eax  /* EAX: i */
	movl    4(%esi), %ebx  /* EBX: j */
	addl    $8, %esi       /* ESI: s */
	
	/* Initialize */
	movl    $0, %ecx  /* Need to ensure upper 16 bits are clear */
	cmpl    %edi, %edx
	je      .rc4_encrypt_bottom
	
.rc4_encrypt_top:
	/* Increment i mod 256 */
	addb    $1, %al
	
	/* Add s[i] to j mod 256 */
	movb    (%esi,%eax), %cl  /* CL: Temporary s[i] */
	addb    %cl, %bl
	
	/* Swap bytes s[i] and s[j] */
	movb    (%esi,%ebx), %ch  /* CH: Temporary s[j] */
	movb    %ch, (%esi,%eax)
	movb    %cl, (%esi,%ebx)
	
	/* Compute key stream byte */
	addb    %ch, %cl  /* CL = s[i] + s[j] mod 256*/
	xorb    %ch, %ch  /* Clear some upper bits so that ECX = CL */
	movb    (%esi,%ecx), %cl
	
	/* XOR with message */
	xorb    %cl, (%edi)
	
	/* Increment and loop */
	addl    $1, %edi
	cmpl    %edi, %edx
	jne     .rc4_encrypt_top
	
.rc4_encrypt_bottom:
	/* Store state variables */
	subl    $8, %esi       /* state */
	movl    %eax, 0(%esi)  /* Save i */
	movl    %ebx, 4(%esi)  /* Save j */
	
	/* Restore registers */
	movl    0(%esp), %ebx
	movl    4(%esp), %esi
	movl    8(%esp), %edi
	
	/* Exit */
	addl    $12, %esp
	popl    %ebp
	ret
