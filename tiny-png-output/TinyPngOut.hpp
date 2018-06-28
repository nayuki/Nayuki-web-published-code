/* 
 * Tiny PNG Output (C++)
 * 
 * Copyright (c) 2018 Project Nayuki
 * https://www.nayuki.io/page/tiny-png-output
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program (see COPYING.txt and COPYING.LESSER.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */

#pragma once

#include <cstddef>
#include <cstdint>
#include <ostream>


/* 
 * Takes image pixel data in raw RGB8.8.8 format and writes a PNG file to a byte output stream.
 */
class TinyPngOut final {
    
    /*---- Fields ----*/
    
	// Immutable configuration
	private: std::uint32_t width;   // Measured in pixels
	private: std::uint32_t height;  // Measured in pixels
	private: std::uint32_t lineSize;  // Measured in bytes, equal to (width * 3 + 1)
	
	// Running state
	private: std::ostream &output;
	private: std::uint32_t positionX;      // Next byte index in current line
	private: std::uint32_t positionY;      // Line index of next byte
	private: std::uint32_t uncompRemain;   // Number of uncompressed bytes remaining
	private: std::uint16_t deflateFilled;  // Bytes filled in the current block (0 <= n < DEFLATE_MAX_BLOCK_SIZE)
	private: std::uint32_t crc;    // Primarily for IDAT chunk
	private: std::uint32_t adler;  // For DEFLATE data within IDAT
	
	
	
	/*---- Public constructor and method ----*/
	
	/* 
	 * Creates a PNG writer with the given width and height (both non-zero) and byte output stream.
	 * TinyPngOut will leave the output stream still open once it finishes writing the PNG file data.
	 * Throws an exception if the dimensions exceed certain limits (e.g. w * h > 700 million).
	 */
	public: explicit TinyPngOut(std::uint32_t w, std::uint32_t h, std::ostream &out);
	
	
	/* 
	 * Writes 'count' pixels from the given array to the output stream. This reads count*3
	 * bytes from the array. Pixels are presented from top to bottom, left to right, and with
	 * subpixels in RGB order. This object keeps track of how many pixels were written and
	 * various position variables. It is an error to write more pixels in total than width*height.
	 * Once exactly width*height pixels have been written with this TinyPngOut object,
	 * there are no more valid operations on the object and it should be discarded.
	 */
	public: void write(const std::uint8_t pixels[], size_t count);
	
	
	
	/*---- Private checksum methods ----*/
	
	// Reads the 'crc' field and updates its value based on the given array of new data.
	private: void crc32(const std::uint8_t data[], size_t len);
	
	
	// Reads the 'adler' field and updates its value based on the given array of new data.
	private: void adler32(const std::uint8_t data[], size_t len);
	
	
	
	/*---- Private utility members ----*/
	
	private: template <std::size_t N>
	void write(const std::uint8_t (&data)[N]) {
		output.write(reinterpret_cast<const char*>(data), sizeof(data));
	}
	
	
	private: static void putBigUint32(std::uint32_t val, std::uint8_t array[4]);
	
	
	private: static constexpr std::uint16_t DEFLATE_MAX_BLOCK_SIZE = 65535;
	
};
