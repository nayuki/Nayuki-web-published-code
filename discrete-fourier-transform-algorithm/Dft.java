/*
 * Discrete Fourier transform
 * Copyright (c) 2011 Nayuki Minase
 */


public final class Dft {
	
	public static void computeDft(double[] inreal, double[] inimag, double[] outreal, double[] outimag) {
		int n = inreal.length;
		for (int k = 0; k < n; k++) {  // For each output element
			double sumreal = 0;
			double sumimag = 0;
			for (int t = 0; t < n; t++) {  // For each input element
				sumreal += inreal[t]*Math.cos(2*Math.PI * t * k / n) - inimag[t]*Math.sin(2*Math.PI * t * k / n);
				sumimag += inreal[t]*Math.sin(2*Math.PI * t * k / n) + inimag[t]*Math.cos(2*Math.PI * t * k / n);
			}
			outreal[k] = sumreal;
			outimag[k] = sumimag;
		}
	}
	
}
