// DWITE - December 2006 - Problem 5: Caesar's Cipher
// Solution by Nayuki Minase


public final class dwite200612p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA51.txt", "OUT51.txt", new dwite200612p5());
	}
	
	
	protected void runOnce() {
		// Read input
		String ciphertext = io.readLine();
		String someplaintext = io.readLine();
		
		// Derive shift from the leading character, decrypt, and write output
		int shift = (ciphertext.charAt(0) - someplaintext.charAt(0) + 26) % 26;
		io.println(decrypt(ciphertext, shift));
	}
	
	
	private static String encrypt(String s, int shift) {
		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (isUppercase(c))
				sb.append((char)((c - 'A' + shift) % 26 + 'A'));
			else
				sb.append(c);
		}
		return sb.toString();
	}
	
	
	private static String decrypt(String s, int shift) {
		return encrypt(s, (26 - shift) % 26);
	}
	
	
	private static boolean isUppercase(char c) {
		return c >= 'A' && c <= 'Z';
	}
	
}
