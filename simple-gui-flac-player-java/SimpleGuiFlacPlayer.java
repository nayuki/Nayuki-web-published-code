/* 
 * Simple GUI FLAC player
 * 
 * Copyright (c) 2017 Project Nayuki
 * https://www.nayuki.io/page/simple-gui-flac-player-java
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

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.event.*;
import java.io.*;
import java.util.Arrays;
import javax.sound.sampled.*;
import javax.swing.*;
import javax.swing.filechooser.FileNameExtensionFilter;
import javax.swing.plaf.basic.BasicSliderUI;
import javax.swing.plaf.metal.MetalSliderUI;


/**
 * A GUI application which lets you open a FLAC file, listen to the audio, and seek to positions
 * in the file. Run this program with no command line arguments: java SimpleGuiFlacPlayer.
 */
public final class SimpleGuiFlacPlayer {
	
	/*---- User interface logic ----*/
	
	private static JFrame frame;
	private static JSlider slider;
	private static BasicSliderUI sliderUi;
	private static File lastDir = null;
	
	
	public static void main(String[] args) {
		// Create and configure button
		JButton open = new JButton("Open file");
		open.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				JFileChooser fc = new JFileChooser(lastDir);
				fc.setFileFilter(new FileNameExtensionFilter("FLAC audio files", "flac"));
				if (fc.showOpenDialog(frame) == JFileChooser.APPROVE_OPTION) {
					synchronized(lock) {
						openRequest = fc.getSelectedFile();
						lock.notify();
					}
					lastDir = fc.getSelectedFile().getParentFile();
				}
			}
		});
		
		// Create and configure slider
		slider = new JSlider(SwingConstants.HORIZONTAL, 0, 10000, 0);
		sliderUi = new MetalSliderUI();
		slider.setUI(sliderUi);
		slider.setEnabled(false);
		slider.setPreferredSize(new Dimension(800, 40));
		slider.addMouseListener(new MouseAdapter() {
			public void mousePressed(MouseEvent ev) {
				moveSlider(ev);
			}
			public void mouseReleased(MouseEvent ev) {
				moveSlider(ev);
				if (slider.isEnabled()) {
					synchronized(lock) {
						seekRequest = (double)slider.getValue() / slider.getMaximum();
						lock.notify();
					}
				}
			}
		});
		slider.addMouseMotionListener(new MouseMotionAdapter() {
			public void mouseDragged(MouseEvent ev) {
				moveSlider(ev);
			}
		});
		
		// Create and configure window
		frame = new JFrame("FLAC Player");
		frame.add(open, BorderLayout.WEST);
		frame.add(slider, BorderLayout.CENTER);
		frame.pack();
		frame.addWindowListener(new WindowAdapter() {
			public void windowClosing(WindowEvent ev) {
				System.exit(0);
			}
		});
		frame.setResizable(true);
		frame.setVisible(true);
		
		// Start processing commands and audio data
		doAudioDecoderWorkerLoop();
	}
	
	
	// Called by the audio worker.
	private static void setSliderPosition(final double t) {
		SwingUtilities.invokeLater(new Runnable() {
			public void run() {
				if (!slider.getValueIsAdjusting())
					slider.setValue((int)Math.round(t * slider.getMaximum()));
			}
		});
	}
	
	// Called internally within the GUI.
	private static void moveSlider(MouseEvent ev) {
		if (slider.isEnabled())
			slider.setValue(sliderUi.valueForXPosition(ev.getX()));
	}
	
	
	
	/*---- Audio decoder worker logic ----*/
	
	// GUI-to-decoder communication
	private static Object lock = new Object();
	private static File openRequest = null;
	private static double seekRequest = -1;  // Either -1 or a number in [0.0, 1.0]
	
	// Decoder state
	private static FlacDecoder dec = null;
	private static SourceDataLine line = null;
	private static long clipStartTime;
	
	
	private static void doAudioDecoderWorkerLoop() {
		while (true) {
			try {
				doWorkerIteration();
			} catch (IOException|LineUnavailableException e) {
				String prefix;
				if (e instanceof FlacDecoder.FormatException) prefix = "FLAC format";
				else if (e instanceof IOException) prefix = "I/O";
				else if (e instanceof LineUnavailableException) prefix = "Line unavailable";
				else prefix = "General";
				final String msg = prefix + " exception: " + e.getMessage();
				SwingUtilities.invokeLater(new Runnable() {
					public void run() {
						JOptionPane.showMessageDialog(frame, msg);
						frame.setTitle("FLAC Player");
						setSliderPosition(0);
						slider.setEnabled(false);
					}
				});
				try {
					closeFile();
				} catch (IOException ee) {
					ee.printStackTrace();
					System.exit(1);
				}
			} catch (InterruptedException e) {}
		}
	}
		
	
	// Tries to decode+play a block of audio, process an asynchronous request, wait for a request, or throws an exception.
	private static void doWorkerIteration() throws IOException, LineUnavailableException, InterruptedException {
		// Take request from shared variables
		File openReq;
		double seekReq;
		synchronized(lock) {
			openReq = openRequest;
			openRequest = null;
			seekReq = seekRequest;
			seekRequest = -1;
		}
		
		// Open or switch files, and start audio line
		if (openReq != null) {
			seekReq = -1;
			closeFile();
			dec = new FlacDecoder(openReq);
			if (dec.numSamples == 0)
				throw new FlacDecoder.FormatException("Unknown audio length");
			AudioFormat format = new AudioFormat(dec.sampleRate, dec.sampleDepth, dec.numChannels, true, false);
			line = (SourceDataLine)AudioSystem.getLine(new DataLine.Info(SourceDataLine.class, format));
			line.open(format);
			line.start();
			String name = openReq.getName();
			if (name.contains("."))
				name = name.substring(0, name.lastIndexOf("."));
			final String title = name + " - FLAC Player";
			SwingUtilities.invokeLater(new Runnable() {
				public void run() {
					frame.setTitle(title);
					slider.setEnabled(true);
				}
			});
			clipStartTime = 0;
		} else if (dec == null) {
			synchronized(lock) {
				while (openRequest == null)
					lock.wait();
			}
			return;
		}
		
		// Decode next audio block, or seek and decode
		long[][] samples = null;
		if (seekReq == -1) {
			Object[] temp = dec.readNextBlock();
			if (temp != null)
				samples = (long[][])temp[0];
		} else {
			long samplePos = Math.round(seekReq * dec.numSamples);
			samples = dec.seekAndReadBlock(samplePos);
			line.flush();
			clipStartTime = line.getMicrosecondPosition() - Math.round(samplePos * 1e6 / dec.sampleRate);
		}
		
		// Set display position
		double timePos = (line.getMicrosecondPosition() - clipStartTime) / 1e6;
		setSliderPosition(timePos * dec.sampleRate / dec.numSamples);
		
		// Wait when end of stream reached
		if (samples == null) {
			synchronized(lock) {
				while (openRequest == null && seekRequest == -1)
					lock.wait();
			}
			return;
		}
		
		// Convert samples to channel-interleaved bytes in little endian
		int bytesPerSample = dec.sampleDepth / 8;
		byte[] sampleBytes = new byte[samples[0].length * samples.length * bytesPerSample];
		for (int i = 0, k = 0; i < samples[0].length; i++) {
			for (int ch = 0; ch < samples.length; ch++) {
				long val = samples[ch][i];
				for (int j = 0; j < bytesPerSample; j++, k++)
					sampleBytes[k] = (byte)(val >>> (j << 3));
			}
		}
		line.write(sampleBytes, 0, sampleBytes.length);
	}
	
	
	private static void closeFile() throws IOException {
		if (dec != null) {
			dec.close();
			dec = null;
		}
		if (line != null) {
			line.close();
			line = null;
		}
	}
	
	
	
	/*---- FLAC decoding logic classes ----*/
	
	private static final class FlacDecoder {
		
		private Stream input;
		private long metadataEndPos;
		
		public int sampleRate = -1;
		public int numChannels = -1;
		public int sampleDepth = -1;
		public long numSamples = -1;
		public int constantBlockSize = -1;
		
		
		public FlacDecoder(File file) throws IOException {
			input = new Stream(file);
			if (input.readUint(32) != 0x664C6143)
				throw new FormatException("Invalid magic string");
			
			// Handle metadata blocks
			for (boolean last = false; !last; ) {
				last = input.readUint(1) != 0;
				int type = input.readUint(7);
				int length = input.readUint(24);
				if (type == 0) {  // Parse stream info block
					int minBlockSize = input.readUint(16);
					int maxBlockSize = input.readUint(16);
					if (minBlockSize == maxBlockSize)
						constantBlockSize = minBlockSize;
					input.readUint(24);
					input.readUint(24);
					sampleRate = input.readUint(20);
					numChannels = input.readUint(3) + 1;
					sampleDepth = input.readUint(5) + 1;
					numSamples = (long)input.readUint(18) << 18 | input.readUint(18);
					for (int i = 0; i < 16; i++)
						input.readUint(8);
				} else {  // Skip other blocks
					for (int i = 0; i < length; i++)
						input.readUint(8);
				}
			}
			if (sampleRate == -1)
				throw new FormatException("Stream info metadata block absent");
			metadataEndPos = input.getPosition();
		}
		
		
		public void close() throws IOException {
			input.close();
		}
		
		
		public long[][] seekAndReadBlock(long samplePos) throws IOException {
			// Binary search to find a frame slightly before requested position
			long startFilePos = metadataEndPos;
			long endFilePos = input.getLength();
			long curSamplePos = 0;
			while (endFilePos - startFilePos > 100000) {
				long middle = (startFilePos + endFilePos) / 2;
				long[] offsets = findNextDecodableFrame(middle);
				if (offsets == null || offsets[1] > samplePos)
					endFilePos = middle;
				else {
					startFilePos = offsets[0];
					curSamplePos = offsets[1];
				}
			}
			
			input.seekTo(startFilePos);
			while (true) {
				Object[] temp = readNextBlock();
				if (temp == null)
					return null;
				long[][] samples = (long[][])temp[0];
				int blockSize = samples[0].length;
				long nextSamplePos = curSamplePos + blockSize;
				if (nextSamplePos > samplePos) {
					long[][] result = new long[samples.length][];
					for (int ch = 0; ch < numChannels; ch++)
						result[ch] = Arrays.copyOfRange(samples[ch], (int)(samplePos - curSamplePos), blockSize);
					return result;
				}
				curSamplePos = nextSamplePos;
			}
		}
		
		
		// Returns (filePosition, sampleOffset) or null.
		private long[] findNextDecodableFrame(long filePos) throws IOException {
			while (true) {
				input.seekTo(filePos);
				int state = 0;
				while (true) {
					int b = input.readByte();
					if (b == -1)
						return null;
					else if (b == 0xFF)
						state = 1;
					else if (state == 1 && (b & 0xFE) == 0xF8)
						break;
					else
						state = 0;
				}
				filePos = input.getPosition() - 2;
				input.seekTo(filePos);
				try {
					Object[] temp = readNextBlock();
					if (temp == null)
						return null;
					else
						return new long[]{filePos, (long)temp[1]};
				} catch (FormatException e) {
					filePos += 2;
				}
			}
		}
		
		
		// Returns (long[][] blockSamples, long sampleOffsetAtStartOfBlock)
		// if a block is decoded, or null if the end of stream is reached.
		public Object[] readNextBlock() throws IOException {
			// Find next sync code
			int byteVal = input.readByte();
			if (byteVal == -1)
				return null;
			int sync = byteVal << 6 | input.readUint(6);
			if (sync != 0x3FFE)
				throw new FormatException("Sync code expected");
			if (input.readUint(1) != 0)
				throw new FormatException("Reserved bit");
			int blockStrategy = input.readUint(1);;
			
			// Read numerous header fields, and ignore some of them
			int blockSizeCode = input.readUint(4);
			int sampleRateCode = input.readUint(4);
			int chanAsgn = input.readUint(4);
			switch (input.readUint(3)) {
				case 1:  if (sampleDepth !=  8) throw new FormatException("Sample depth mismatch");  break;
				case 2:  if (sampleDepth != 12) throw new FormatException("Sample depth mismatch");  break;
				case 4:  if (sampleDepth != 16) throw new FormatException("Sample depth mismatch");  break;
				case 5:  if (sampleDepth != 20) throw new FormatException("Sample depth mismatch");  break;
				case 6:  if (sampleDepth != 24) throw new FormatException("Sample depth mismatch");  break;
				default:  throw new FormatException("Reserved/invalid sample depth");
			}
			if (input.readUint(1) != 0)
				throw new FormatException("Reserved bit");
			
			byteVal = input.readUint(8);
			long rawPosition;
			if (byteVal < 0x80)
				rawPosition = byteVal;
			else {
				int rawPosNumBytes = Integer.numberOfLeadingZeros(~(byteVal << 24)) - 1;
				rawPosition = byteVal & (0x3F >>> rawPosNumBytes);
				for (int i = 0; i < rawPosNumBytes; i++)
					rawPosition = (rawPosition << 6) | (input.readUint(8) & 0x3F);
			}
			
			int blockSize;
			if (blockSizeCode == 1)
				blockSize = 192;
			else if (2 <= blockSizeCode && blockSizeCode <= 5)
				blockSize = 576 << (blockSizeCode - 2);
			else if (blockSizeCode == 6)
				blockSize = input.readUint(8) + 1;
			else if (blockSizeCode == 7)
				blockSize = input.readUint(16) + 1;
			else if (8 <= blockSizeCode && blockSizeCode <= 15)
				blockSize = 256 << (blockSizeCode - 8);
			else
				throw new FormatException("Reserved block size");
			
			if (sampleRateCode == 12)
				input.readUint(8);
			else if (sampleRateCode == 13 || sampleRateCode == 14)
				input.readUint(16);
			
			input.readUint(8);
			
			// Decode each channel's subframe, then skip footer
			long[][] samples = decodeSubframes(blockSize, sampleDepth, chanAsgn);
			input.alignToByte();
			input.readUint(16);
			return new Object[]{samples, rawPosition * (blockStrategy == 0 ? constantBlockSize : 1)};
		}
		
		
		private long[][] decodeSubframes(int blockSize, int sampleDepth, int chanAsgn) throws IOException {
			long[][] result;
			if (0 <= chanAsgn && chanAsgn <= 7) {
				result = new long[chanAsgn + 1][blockSize];
				for (int ch = 0; ch < result.length; ch++)
					decodeSubframe(sampleDepth, result[ch]);
			} else if (8 <= chanAsgn && chanAsgn <= 10) {
				result = new long[2][blockSize];
				decodeSubframe(sampleDepth + (chanAsgn == 9 ? 1 : 0), result[0]);
				decodeSubframe(sampleDepth + (chanAsgn == 9 ? 0 : 1), result[1]);
				if (chanAsgn == 8) {
					for (int i = 0; i < blockSize; i++)
						result[1][i] = result[0][i] - result[1][i];
				} else if (chanAsgn == 9) {
					for (int i = 0; i < blockSize; i++)
						result[0][i] += result[1][i];
				} else if (chanAsgn == 10) {
					for (int i = 0; i < blockSize; i++) {
						long side = result[1][i];
						long right = result[0][i] - (side >> 1);
						result[1][i] = right;
						result[0][i] = right + side;
					}
				}
			} else
				throw new FormatException("Reserved channel assignment");
			return result;
		}
		
		
		private void decodeSubframe(int sampleDepth, long[] result) throws IOException {
			if (input.readUint(1) != 0)
				throw new FormatException("Invalid padding bit");
			int type = input.readUint(6);
			int shift = input.readUint(1);
			if (shift == 1) {
				while (input.readUint(1) == 0)
					shift++;
			}
			sampleDepth -= shift;
			
			if (type == 0)  // Constant coding
				Arrays.fill(result, 0, result.length, input.readSignedInt(sampleDepth));
			else if (type == 1) {  // Verbatim coding
				for (int i = 0; i < result.length; i++)
					result[i] = input.readSignedInt(sampleDepth);
			} else if (8 <= type && type <= 12 || 32 <= type && type <= 63) {
				int predOrder;
				int[] lpcCoefs;
				int lpcShift;
				if (type <= 12) {  // Fixed prediction
					predOrder = type - 8;
					for (int i = 0; i < predOrder; i++)
						result[i] = input.readSignedInt(sampleDepth);
					lpcCoefs = FIXED_PREDICTION_COEFFICIENTS[predOrder];
					lpcShift = 0;
				} else {  // Linear predictive coding
					predOrder = type - 31;
					for (int i = 0; i < predOrder; i++)
						result[i] = input.readSignedInt(sampleDepth);
					int precision = input.readUint(4) + 1;
					lpcShift = input.readSignedInt(5);
					lpcCoefs = new int[predOrder];
					for (int i = 0; i < predOrder; i++)
						lpcCoefs[i] = input.readSignedInt(precision);
				}
				decodeRiceResiduals(predOrder, result);
				for (int i = predOrder; i < result.length; i++) {  // LPC restoration
					long sum = 0;
					for (int j = 0; j < lpcCoefs.length; j++)
						sum += result[i - 1 - j] * lpcCoefs[j];
					result[i] += sum >> lpcShift;
				}
			} else
				throw new FormatException("Reserved subframe type");
			
			for (int i = 0; i < result.length; i++)
				result[i] <<= shift;
		}
		
		
		private void decodeRiceResiduals(int warmup, long[] result) throws IOException {
			int method = input.readUint(2);
			if (method >= 2)
				throw new FormatException("Reserved residual coding method");
			int paramBits = method == 0 ? 4 : 5;
			int escapeParam = method == 0 ? 0xF : 0x1F;
			int partitionOrder = input.readUint(4);
			int numPartitions = 1 << partitionOrder;
			if (result.length % numPartitions != 0)
				throw new FormatException("Block size not divisible by number of Rice partitions");
			int partitionSize = result.length / numPartitions;
			
			for (int i = 0; i < numPartitions; i++) {
				int start = i * partitionSize + (i == 0 ? warmup : 0);
				int end = (i + 1) * partitionSize;
				int param = input.readUint(paramBits);
				if (param < escapeParam) {
					for (int j = start; j < end; j++) {  // Read Rice signed integers
						long val = 0;
						while (input.readUint(1) == 0)
							val++;
						val = (val << param) | input.readUint(param);
						result[j] = (val >>> 1) ^ -(val & 1);
					}
				} else {
					int numBits = input.readUint(5);
					for (int j = start; j < end; j++)
						result[j] = input.readSignedInt(numBits);
				}
			}
		}
		
		
		private static final int[][] FIXED_PREDICTION_COEFFICIENTS = {
			{},
			{1},
			{2, -1},
			{3, -3, 1},
			{4, -6, 4, -1},
		};
		
		
		
		// Provides low-level bit/byte reading of a file.
		private static final class Stream {
			
			private RandomAccessFile raf;
			private long bytePosition;
			private InputStream byteBuffer;
			private long bitBuffer;
			private int bitBufferLen;
			
			public Stream(File file) throws IOException {
				raf = new RandomAccessFile(file, "r");
				seekTo(0);
			}
			
			
			public void close() throws IOException {
				raf.close();
			}
			
			public long getLength() throws IOException {
				return raf.length();
			}
			
			public long getPosition() {
				return bytePosition;
			}
			
			public void seekTo(long pos) throws IOException {
				raf.seek(pos);
				bytePosition = pos;
				byteBuffer = new BufferedInputStream(new InputStream() {
					public int read() throws IOException {
						return raf.read();
					}
					public int read(byte[] b, int off, int len) throws IOException {
						return raf.read(b, off, len);
					}
				});
				bitBufferLen = 0;
			}
			
			public int readByte() throws IOException {
				if (bitBufferLen >= 8)
					return readUint(8);
				else {
					int result = byteBuffer.read();
					if (result != -1)
						bytePosition++;
					return result;
				}
			}
			
			public int readUint(int n) throws IOException {
				while (bitBufferLen < n) {
					int temp = byteBuffer.read();
					if (temp == -1)
						throw new EOFException();
					bytePosition++;
					bitBuffer = (bitBuffer << 8) | temp;
					bitBufferLen += 8;
				}
				bitBufferLen -= n;
				int result = (int)(bitBuffer >>> bitBufferLen);
				if (n < 32)
					result &= (1 << n) - 1;
				return result;
			}
			
			public int readSignedInt(int n) throws IOException {
				return (readUint(n) << (32 - n)) >> (32 - n);
			}
			
			public void alignToByte() {
				bitBufferLen -= bitBufferLen % 8;
			}
			
		}
		
		
		
		// Thrown when non-conforming FLAC data is read.
		@SuppressWarnings("serial")
		public static class FormatException extends IOException {
			public FormatException(String msg) {
				super(msg);
			}
		}
		
	}
	
}
