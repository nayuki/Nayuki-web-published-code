/* 
 * Band-limited square waves (Java)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/band-limited-square-waves
 */

import java.io.BufferedOutputStream;
import java.io.DataOutput;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;


public final class GenerateSquareWave {
	
	public static void main(String[] args) throws IOException {
		// Check number of command line arguments
		if (args.length != 5 && args.length != 6) {
			System.err.println("Usage: java GenerateSquareWave Frequency DutyCycle SampleRate Duration [BandLimited/Naive] Output.wav");
			System.err.println("Example: java GenerateSquareWave 440.0 0.5 48000 1.0 BandLimited Output.wav");
			System.exit(1);
			return;
		}
		
		// Get all command line arguments
		double frequency = Double.parseDouble(args[0]);
		double dutyCycle = Double.parseDouble(args[1]);
		int sampleRate = Integer.parseInt(args[2]);
		double duration = Double.parseDouble(args[3]);
		String mode;
		File outFile;
		if (args.length == 5) {
			mode = "BandLimited";
			outFile = new File(args[4]);
		} else if (args.length == 6) {
			mode = args[4];
			outFile = new File(args[5]);
		} else
			throw new AssertionError();
		
		// Check value ranges
		if (frequency <= 0)
			throw new IllegalArgumentException("Frequency must be positive");
		if (dutyCycle < 0 || dutyCycle > 1)
			throw new IllegalArgumentException("Duty cycle must be between 0 and 1");
		if (sampleRate <= 0)
			throw new IllegalArgumentException("Sample rate must be positive");
		if (duration < 0)
			throw new IllegalArgumentException("Duration must be non-negative");
		if (!mode.equals("BandLimited") && !mode.equals("Naive"))
			throw new IllegalArgumentException("Invalid mode specification");
		
		// Start writing file data
		int numSamples = (int)Math.round(duration * sampleRate);
		try (DataOutputStream out = new DataOutputStream(new BufferedOutputStream(new FileOutputStream(outFile)))) {
			// Write WAV header
			out.write("RIFF".getBytes(StandardCharsets.US_ASCII));
			writeLittleInt32(36 + numSamples * 4, out);
			out.write("WAVE".getBytes(StandardCharsets.US_ASCII));
			out.write("fmt ".getBytes(StandardCharsets.US_ASCII));
			writeLittleInt32(16, out);
			writeLittleInt16(0x0003, out);
			writeLittleInt16(1, out);
			writeLittleInt32(sampleRate, out);
			writeLittleInt32(sampleRate * 4, out);
			writeLittleInt16(4, out);
			writeLittleInt16(32, out);
			out.write("data".getBytes(StandardCharsets.US_ASCII));
			writeLittleInt32(numSamples * 4, out);
			
			if (mode.equals("BandLimited")) {
				// Calculate harmonic amplitudes
				int numHarmonics = (int)(sampleRate / (frequency * 2));
				double[] coefficients = new double[numHarmonics + 1];
				coefficients[0] = dutyCycle - 0.5;  // Start with DC coefficient
				for (int i = 1; i < coefficients.length; i++)
					coefficients[i] = Math.sin(i * dutyCycle * Math.PI) * 2 / (i * Math.PI);
				
				// Generate audio samples
				double scaler = frequency * Math.PI * 2 / sampleRate;
				for (int i = 0; i < numSamples; i++) {
					double temp = scaler * i;
					double val = coefficients[0];
					for (int j = 1; j < coefficients.length; j++)
						val += Math.cos(j * temp) * coefficients[j];
					writeLittleFloat32((float)val, out);
				}
				
			} else if (mode.equals("Naive")) {
				double scaler = frequency / sampleRate;
				double shift = dutyCycle / 2;
				for (int i = 0; i < numSamples; i++) {
					float val = (i * scaler + shift) % 1 < dutyCycle ? 0.5f : -0.5f;
					writeLittleFloat32(val, out);
				}
				
			} else
				throw new AssertionError();
		}
	}
	
	
	
	private static void writeLittleInt16(int val, DataOutput out) throws IOException {
		out.writeShort(Integer.reverseBytes(val) >>> 16);
	}
	
	private static void writeLittleInt32(int val, DataOutput out) throws IOException {
		out.writeInt(Integer.reverseBytes(val));
	}
	
	private static void writeLittleFloat32(float val, DataOutput out) throws IOException {
		out.writeInt(Integer.reverseBytes(Float.floatToRawIntBits(val)));
	}
	
}
