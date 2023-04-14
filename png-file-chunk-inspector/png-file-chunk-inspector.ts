/* 
 * PNG file chunk inspector
 * 
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/png-file-chunk-inspector
 */


namespace app {
	
	type byte = number;
	type int = number;
	
	
	/*---- Graphical user interface ----*/
	
	function initialize(): void {
		let selectElem = requireType(document.querySelector("article table#input select"), HTMLSelectElement);
		let fileElem = requireType(document.querySelector("article table#input input[type=file]"), HTMLInputElement);
		let checkboxElem = requireType(document.querySelector("article table#input input[type=checkbox]"), HTMLInputElement);
		let ignoreSelect: boolean = false;
		let ignoreFile: boolean = false;
		
		selectElem.selectedIndex = 0;
		for (const [valid, topics, fileName] of SAMPLE_FILES) {
			const temp: Array<string> = topics.slice();
			temp.splice(1, 0, (valid ? "Good" : "Bad"));
			let option = requireType(appendElem(selectElem, "option", temp.join(" - ")), HTMLOptionElement);
			option.value = fileName;
		}
		let aElem = requireType(document.querySelector("article table#input a"), HTMLAnchorElement);
		
		selectElem.onchange = (): void => {
			if (ignoreSelect)
				return;
			else if (selectElem.selectedIndex == 0)
				aElem.style.display = "none";
			else {
				ignoreFile = true;
				fileElem.value = "";
				ignoreFile = false;
				
				const filePath: string = "/res/png-file-chunk-inspector/" + selectElem.value;
				aElem.style.removeProperty("display");
				aElem.href = filePath;
				let xhr = new XMLHttpRequest();
				xhr.onload = (): void => visualizeFile(xhr.response, checkboxElem.checked);
				xhr.open("GET", filePath);
				xhr.responseType = "arraybuffer";
				xhr.send();
			}
		};
		
		fileElem.onchange = (): void => {
			if (ignoreFile)
				return;
			ignoreSelect = true;
			selectElem.selectedIndex = 0;
			ignoreSelect = false;
			
			aElem.style.display = "none";
			const files: FileList|null = fileElem.files;
			if (files === null || files.length < 1)
				return;
			let reader = new FileReader();
			reader.onload = (): void => visualizeFile(reader.result, checkboxElem.checked);
			reader.readAsArrayBuffer(files[0]);
		};
	}
	
	setTimeout(initialize);
	
	
	function visualizeFile(fileArray: any, checkIdats: boolean): void {
		const fileBytes = new Uint8Array(requireType(fileArray, ArrayBuffer));
		
		let table = requireType(document.querySelector("article table#output"), HTMLElement);
		table.classList.remove("errors");
		let tbody = requireType(table.querySelector("tbody"), HTMLElement);
		while (tbody.firstChild !== null)
			tbody.removeChild(tbody.firstChild);
		
		const parts: Array<FilePart> = parseFile(fileBytes, checkIdats);
		let summary: string = "";
		for (let i = 0; i < parts.length; i++) {
			const part: FilePart = parts[i];
			if (part instanceof ChunkPart) {
				if (summary != "")
					summary += ", ";
				summary += part.typeStr;
				if (part.typeStr == "IDAT") {
					let count: int = 1;
					for (; i + 1 < parts.length; i++, count++) {
						const nextPart: FilePart = parts[i + 1];
						if (!(nextPart instanceof ChunkPart) || nextPart.typeStr != "IDAT")
							break;
					}
					if (count > 1)
						summary += " \u00D7" + count;
				}
			}
		}
		requireType(document.querySelector("article span#summary"), HTMLElement).textContent = summary;
		
		for (const part of parts) {
			let tr: HTMLElement = appendElem(tbody, "tr");
			appendElem(tr, "td", uintToStrWithThousandsSeparators(part.offset));
			
			{
				let td: HTMLElement = appendElem(tr, "td");
				let hex: Array<string> = [];
				const bytes: Uint8Array = part.bytes;
				const pushHex = function(index: int): void {
					hex.push(bytes[index].toString(16).padStart(2, "0"));
				};
				
				if (bytes.length <= 100) {
					for (let i = 0; i < bytes.length; i++)
						pushHex(i);
				} else {
					for (let i = 0; i < 70; i++)
						pushHex(i);
					hex.push("...");
					for (let i = bytes.length - 30; i < bytes.length; i++)
						pushHex(i);
				}
				appendElem(td, "code", hex.join(" "));
			}
			
			for (const list of [part.outerNotes, part.innerNotes, part.errorNotes]) {
				let td: HTMLElement = appendElem(tr, "td");
				let ul: HTMLElement = appendElem(td, "ul");
				for (const item of list) {
					if (list == part.errorNotes)
						table.classList.add("errors");
					let li: HTMLElement = appendElem(ul, "li");
					li.append(item);
				}
			}
		}
	}
	
	
	const SAMPLE_FILES: Array<[boolean,Array<string>,string]> = [
		[true , ["Normal", "One black pixel"], "good_normal_one-black-pixel.png"],
		[true , ["Normal", "One black pixel", "Paletted"], "good_normal_one-black-pixel_paletted.png"],
		[true , ["Normal", "Tiny RGB gray"], "good_normal_tiny-rgb-gray.png"],
		
		[false, ["Signature", "Empty"], "bad_signature_empty.png"],
		[false, ["Signature", "Mismatch, truncated"], "bad_signature_mismatch-truncated.png"],
		[false, ["Signature", "Mismatch"], "bad_signature_mismatch.png"],
		[false, ["Signature", "Truncated"], "bad_signature_truncated.png"],
		[false, ["Chunks", "Empty"], "bad_chunks_empty.png"],
		[false, ["Chunk", "Length", "Truncated"], "bad_chunk_length_truncated.png"],
		[false, ["Chunk", "Length", "Overflow"], "bad_chunk_length_overflow.png"],
		[false, ["Chunk", "Type", "Truncated"], "bad_chunk_type_truncated.png"],
		[false, ["Chunk", "Type", "Wrong characters"], "bad_chunk_type_wrong-characters.png"],
		[false, ["Chunk", "Data", "Truncated"], "bad_chunk_data_truncated.png"],
		[false, ["Chunk", "CRC", "Truncated"], "bad_chunk_crc_truncated.png"],
		[false, ["Chunk", "CRC", "Mismatch"], "bad_chunk_crc_mismatch.png"],
		
		[true , ["bKGD", "Sans palette"], "good_bkgd_sans-palette.png"],
		[true , ["bKGD", "With palette"], "good_bkgd_with-palette.png"],
		[false, ["bKGD", "Wrong length"], "bad_bkgd_wrong-length.png"],
		[false, ["bKGD", "Wrong color"], "bad_bkgd_wrong-color.png"],
		[false, ["bKGD", "Wrong index"], "bad_bkgd_wrong-index.png"],
		[true , ["cHRM", "Rec. 709"], "good_chrm_rec-709.png"],
		[true , ["cHRM", "Rec. 2020"], "good_chrm_rec-2020.png"],
		[false, ["cHRM", "Wrong length"], "bad_chrm_wrong-length.png"],
		[true , ["gAMA", "0.45455"], "good_gama_0.45455.png"],
		[true , ["gAMA", "1.00000"], "good_gama_1.00000.png"],
		[false, ["gAMA", "Misordered"], "bad_gama_misordered.png"],
		[true , ["hIST"], "good_hist.png"],
		[false, ["hIST", "Wrong length"], "bad_hist_wrong-length.png"],
		[true , ["IDAT", "Progressive"], "good_idat_progressive.png"],
		[true , ["IDAT", "Interlaced"], "good_idat_interlaced.png"],
		[true , ["IDAT", "Multiple"], "good_idat_multiple.png"],
		[true , ["IDAT", "Some empty"], "good_idat_some-empty.png"],
		[false, ["IDAT", "Non-consecutive"], "bad_idat_nonconsecutive.png"],
		[false, ["IDAT", "zlib", "Wrong header checksum"], "bad_idat_zlib_wrong-header-checksum.png"],
		[false, ["IDAT", "zlib", "Wrong Adler-32"], "bad_idat_zlib_wrong-adler32.png"],
		[false, ["IDAT", "zlib", "Extra data after"], "bad_idat_zlib_extra-data-after.png"],
		[false, ["IDAT", "DEFLATE", "Truncated"], "bad_idat_deflate_truncated.png"],
		[false, ["IDAT", "Image data", "Too short"], "bad_idat_image-data_too-short.png"],
		[false, ["IDAT", "Image data", "Too long"], "bad_idat_image-data_too-long.png"],
		[false, ["IDAT", "Progressive", "Wrong filter"], "bad_idat_progressive_wrong-filter.png"],
		[false, ["IDAT", "Interlaced", "Wrong filter"], "bad_idat_interlaced_wrong-filter.png"],
		[false, ["IHDR", "Wrong length"], "bad_ihdr_wrong-length.png"],
		[false, ["IHDR", "Wrong dimensions"], "bad_ihdr_wrong-dimensions.png"],
		[false, ["IHDR", "Wrong bit depth"], "bad_ihdr_wrong-bit-depth.png"],
		[false, ["IHDR", "Wrong methods"], "bad_ihdr_wrong-methods.png"],
		[true , ["iTXt"], "good_itxt.png"],
		[false, ["iTXt", "Wrong separators"], "bad_itxt_wrong-separators.png"],
		[false, ["iTXt", "Wrong language tags"], "bad_itxt_wrong-language-tags.png"],
		[false, ["iTXt", "Wrong UTF-8"], "bad_itxt_wrong-utf8.png"],
		[false, ["iTXt", "Wrong compression methods"], "bad_itxt_wrong-compression-methods.png"],
		[false, ["iTXt", "Wrong compressed data"], "bad_itxt_wrong-compressed-data.png"],
		[true , ["oFFs", "Micrometre unit"], "good_offs_micrometre-unit.png"],
		[true , ["oFFs", "Pixel unit"], "good_offs_pixel-unit.png"],
		[false, ["oFFs", "Wrong length"], "bad_offs_wrong-length.png"],
		[false, ["oFFs", "Wrong unit"], "bad_offs_wrong-unit.png"],
		[true , ["pHYs", "96 DPI"], "good_phys_96-dpi.png"],
		[true , ["pHYs", "Horizontal stretch"], "good_phys_horizontal-stretch.png"],
		[false, ["pHYs", "Wrong unit"], "bad_phys_wrong-unit.png"],
		[true , ["sBIT"], "good_sbit.png"],
		[false, ["sBIT", "Zero"], "bad_sbit_zero.png"],
		[false, ["sBIT", "Excess"], "bad_sbit_excess.png"],
		[true , ["sPLT"], "good_splt.png"],
		[false, ["sPLT", "Wrong names"], "bad_splt_wrong-names.png"],
		[false, ["sPLT", "Duplicate name"], "bad_splt_duplicate-name.png"],
		[false, ["sPLT", "Wrong bit depth"], "bad_splt_wrong-bit-depth.png"],
		[false, ["sPLT", "Wrong length"], "bad_splt_wrong-length.png"],
		[true , ["sRGB"], "good_srgb.png"],
		[false, ["sRGB", "Wrong length"], "bad_srgb_wrong-length.png"],
		[false, ["sRGB", "Duplicate"], "bad_srgb_duplicate.png"],
		[false, ["sRGB", "Misordered"], "bad_srgb_misordered.png"],
		[true , ["sTER"], "good_ster.png"],
		[false, ["sTER", "Wrong length"], "bad_ster_wrong-length.png"],
		[true , ["tEXt"], "good_text.png"],
		[false, ["tEXt", "Wrong keywords"], "bad_text_wrong-keywords.png"],
		[false, ["tEXt", "Wrong text"], "bad_text_wrong-text.png"],
		[true , ["tIME", "Leap second"], "good_time_leap-second.png"],
		[true , ["tIME", "Unix epoch"], "good_time_unix-epoch.png"],
		[false, ["tIME", "Wrong length"], "bad_time_wrong-length.png"],
		[false, ["tIME", "Wrong fields"], "bad_time_wrong-fields.png"],
		[false, ["tIME", "Wrong day"], "bad_time_wrong-day.png"],
		[false, ["tIME", "Misordered"], "bad_time_misordered.png"],
		[true , ["tRNS", "Sans palette"], "good_trns_sans-palette.png"],
		[true , ["tRNS", "With palette"], "good_trns_with-palette.png"],
		[false, ["tRNS", "Wrong color"], "bad_trns_wrong-color.png"],
		[false, ["tRNS", "Wrong length"], "bad_trns_wrong-length.png"],
		[true , ["zTXt"], "good_ztxt.png"],
		[false, ["zTXt", "Wrong keywords"], "bad_ztxt_wrong-keywords.png"],
		[false, ["zTXt", "Wrong compression methods"], "bad_ztxt_wrong-compression-methods.png"],
		[false, ["zTXt", "Wrong compressed data"], "bad_ztxt_wrong-compressed-data.png"],
	];
	
	
	
	/*---- PNG file parser ----*/
	
	function parseFile(fileBytes: Uint8Array, checkIdats: boolean): Array<FilePart> {
		let result: Array<FilePart> = [];
		let isSignatureValid: boolean;
		let offset: int = 0;
		
		{  // Parse file signature
			const bytes: Uint8Array = fileBytes.subarray(offset, Math.min(offset + SignaturePart.FILE_SIGNATURE.length, fileBytes.length));
			const part = new SignaturePart(offset, bytes);
			result.push(part);
			isSignatureValid = part.errorNotes.length == 0;
			offset += bytes.length;
		}
		
		if (!isSignatureValid && offset < fileBytes.length) {
			const bytes: Uint8Array = fileBytes.subarray(offset, fileBytes.length);
			let part = new UnknownPart(offset, bytes);
			part.errorNotes.push("Unknown format");
			result.push(part);
			offset += bytes.length;
			
		} else if (isSignatureValid) {
			// Parse chunks but carefully handle erroneous file structures
			while (offset < fileBytes.length) {
				// Begin by assuming that the next chunk is invalid
				let bytes: Uint8Array = fileBytes.subarray(offset, fileBytes.length);
				const remain: int = bytes.length;
				if (remain >= 4) {
					const innerLen: int = readUint32(fileBytes, offset);
					const outerLen: int = innerLen + 12;
					if (innerLen <= ChunkPart.MAX_DATA_LENGTH && outerLen <= remain)
						bytes = fileBytes.subarray(offset, offset + outerLen);  // Chunk is now valid with respect to length
				}
				result.push(new ChunkPart(offset, bytes));
				offset += bytes.length;
			}
			
			// Annotate chunks
			let earlierChunks: Array<ChunkPart> = [];
			let earlierTypes = new Set<string>();
			const numFctl: int = result.filter(part => part instanceof ChunkPart && part.typeStr == "fcTL").length;
			let currentFctl: ChunkPart|null = null;
			let idatAfterFctl: boolean = false;
			let fdatAfterFctl: boolean = false;
			for (const part of result) {
				if (!(part instanceof ChunkPart))
					continue;
				
				const type: string = part.typeStr;
				if (type != "IHDR" && type != "" && !earlierTypes.has("IHDR"))
					part.errorNotes.push("Chunk must be after IHDR chunk");
				if (type != "IEND" && type != "" && earlierTypes.has("IEND"))
					part.errorNotes.push("Chunk must be before IEND chunk");
				const typeInfo = part.getTypeInfo();
				if (typeInfo !== null && !typeInfo[1] && earlierTypes.has(type))
					part.errorNotes.push("Multiple chunks of this type disallowed");
				
				part.annotate(earlierChunks);
				if (part.typeStr == "acTL" && part.data.length >= 4 && readUint32(part.data, 0) != numFctl)
					part.errorNotes.push(`Number of frames mismatches number of fcTL chunks (${numFctl})`);
				if (part.typeStr == "fcTL") {
					if (currentFctl !== null) {
						if (!idatAfterFctl && !fdatAfterFctl)
							currentFctl.errorNotes.push("Missing IDAT or fdAT chunks after");
						else if (idatAfterFctl && fdatAfterFctl)
							currentFctl.errorNotes.push("Has IDAT and fdAT chunks after");
					}
					currentFctl = part;
					idatAfterFctl = false;
					fdatAfterFctl = false;
				}
				idatAfterFctl = idatAfterFctl || (currentFctl !== null && part.typeStr == "IDAT");
				fdatAfterFctl = fdatAfterFctl || (currentFctl !== null && part.typeStr == "fdAT");
				earlierChunks.push(part);
				earlierTypes.add(type);
			}
			if (currentFctl !== null) {
				if (!idatAfterFctl && !fdatAfterFctl)
					currentFctl.errorNotes.push("Missing IDAT or fdAT chunks after");
				else if (idatAfterFctl && fdatAfterFctl)
					currentFctl.errorNotes.push("Has IDAT and fdAT chunks after");
			}
			
			{  // Find, pair up, and annotate dSIG chunks
				let ihdrIndex: int = 0;
				while (ihdrIndex < result.length && (!(result[ihdrIndex] instanceof ChunkPart) || (result[ihdrIndex] as ChunkPart).typeStr != "IHDR"))
					ihdrIndex++;
				let iendIndex: int = 0;
				while (iendIndex < result.length && (!(result[iendIndex] instanceof ChunkPart) || (result[iendIndex] as ChunkPart).typeStr != "IEND"))
					iendIndex++;
				
				let processedDsigs = new Set<ChunkPart>();
				if (ihdrIndex < result.length && iendIndex < result.length) {
					let start: int = ihdrIndex + 1;
					let end: int = iendIndex - 1;
					for (; start < end; start++, end--) {
						const startPart: FilePart = result[start];
						const endPart  : FilePart = result[end  ];
						if (!(startPart instanceof ChunkPart && startPart.typeStr == "dSIG" &&
								endPart instanceof ChunkPart && endPart.typeStr == "dSIG"))
							break;
						startPart.innerNotes.push("Introductory");
						endPart.innerNotes.push("Terminating");
						processedDsigs.add(startPart);
						processedDsigs.add(endPart);
					}
					for (; start < end; start++) {
						const part: FilePart = result[start];
						if (!(part instanceof ChunkPart && part.typeStr == "dSIG"))
							break;
						part.innerNotes.push("Introductory");
						part.errorNotes.push("Missing corresponding terminating dSIG chunk");
					}
					for (; start < end; end--) {
						const part: FilePart = result[start];
						if (!(part instanceof ChunkPart && part.typeStr == "dSIG"))
							break;
						part.innerNotes.push("Terminating");
						part.errorNotes.push("Missing corresponding introductory dSIG chunk");
					}
				}
				for (const part of result) {
					if (part instanceof ChunkPart && part.typeStr == "dSIG" && !processedDsigs.has(part))
						part.errorNotes.push("Chunk must be consecutively after IHDR chunk or consecutively before IEND chunk");
				}
			}
			
			let part = new UnknownPart(offset, new Uint8Array());
			const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(earlierChunks);
			if (!earlierTypes.has("IHDR"))
				part.errorNotes.push("Missing IHDR chunk");
			if (ihdr !== null && ihdr[9] == 3 && !earlierTypes.has("PLTE"))
				part.errorNotes.push("Missing PLTE chunk");
			if ((earlierTypes.has("fcTL") || earlierTypes.has("fdAT")) && !earlierTypes.has("acTL"))
				part.errorNotes.push("Missing acTL chunk");
			if (!earlierTypes.has("IDAT"))
				part.errorNotes.push("Missing IDAT chunk");
			if (!earlierTypes.has("IEND"))
				part.errorNotes.push("Missing IEND chunk");
			if (part.errorNotes.length > 0)
				result.push(part);
		}
		
		if (offset != fileBytes.length)
			throw new Error("Assertion error");
		if (checkIdats)
			doCheckIdats(result);
		return result;
	}
	
	
	function doCheckIdats(parts: Array<FilePart>): void {
		const chunks = parts.filter(part => part instanceof ChunkPart) as Array<ChunkPart>;
		
		let data: Uint8Array;
		let chunk: ChunkPart;
		{
			const idats: Array<ChunkPart> = chunks.filter(ch => ch.typeStr == "IDAT");
			if (idats.length == 0)
				return;
			
			let concat = new Uint8Array(idats.reduce((a, v) => a + v.data.length, 0));
			let offset: int = 0;
			for (const idat of idats) {
				for (let i = 0; i < idat.data.length; i++, offset++)
					concat[offset] = idat.data[i];
			}
			
			chunk = idats[0];
			try {
				data = decompressZlibDeflate(concat);
			} catch (e) {
				chunk.errorNotes.push("Decompression error: " + e.message);
				return;
			}
		}
		chunk.innerNotes.push(`Decompressed data length: ${uintToStrWithThousandsSeparators(data.length)} bytes`);
		
		const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(chunks);
		if (ihdr === null)
			return;
		const width : int = readUint32(ihdr, 0);
		const height: int = readUint32(ihdr, 4);
		const bitDepth : byte = ihdr[ 8];
		const colorType: byte = ihdr[ 9];
		const laceMeth : byte = ihdr[12];
		let numChannels: int;
		{
			let temp: int|null = lookUpTable(colorType, [
				[0, 1],
				[2, 3],
				[3, 1],
				[4, 2],
				[6, 4],
			]);
			if (temp === null)
				return;
			numChannels = temp;
		}
		const plteNumEntries: int|null = colorType == 3 ? ChunkPart.getValidPlteNumEntries(chunks) : null;
		
		let xStep: int;
		{
			let temp: int|null = lookUpTable(laceMeth, [
				[0, 1],
				[1, 8],
			]);
			if (temp === null)
				return;
			xStep = temp;
		}
		let yStep: int = xStep;
		let pass: int = 0;
		let offset: int = 0;
		
		function handleSubimage(xOffset: int, yOffset: int): void {
			const subwidth  = Math.ceil((width  - xOffset) / xStep);
			const subheight = Math.ceil((height - yOffset) / yStep);
			const bytesPerRow: int = 1 + Math.ceil(subwidth * bitDepth * numChannels / 8);
			chunk.innerNotes.push(`Pass ${pass}: ${subwidth} \u00D7 ${subheight}, ` +
				`${uintToStrWithThousandsSeparators((subwidth > 0 ? bytesPerRow : 0) * subheight)} bytes`);
			pass++;
			if (subwidth == 0 || subheight == 0)
				return;
			for (let y = 0; y < subheight; y++) {
				if (data.length - offset < bytesPerRow)
					throw new Error("Decompressed data too short");
				const filter: byte = data[offset];
				offset++;
				if (filter >= 5)
					throw new Error(`Invalid row filter (${filter})`);
				if (plteNumEntries === null)
					offset += bytesPerRow - 1;
				else {
					for (let x = 0, bitBuf = 0, bitBufLen = 0; x < subwidth; x++) {
						if (bitBufLen == 0) {
							bitBuf = data[offset];
							offset++;
							bitBufLen = 8;
						}
						bitBuf <<= bitDepth
						const val: int = bitBuf >>> 8;
						bitBuf &= 0xFF;
						bitBufLen -= bitDepth;
						if (val >= plteNumEntries)
							throw new Error(`Color index (${val}) out of palette range`);
					}
				}
			}
		}
		
		try {
			handleSubimage(0, 0);
			while (yStep > 1) {
				if (xStep == yStep) {
					handleSubimage(xStep / 2, 0);
					xStep /= 2;
				} else if (xStep == yStep / 2) {
					handleSubimage(0, xStep);
					yStep = xStep;
				} else
					throw new Error("Unreachable value");
			}
			if (offset < data.length)
				throw new Error("Decompressed data too long");
		} catch (e) {
			chunk.errorNotes.push(e.message);
		}
	}
	
	
	
	/*---- Classes representing different file parts ----*/
	
	abstract class FilePart {
		
		public outerNotes: Array<string|Node> = [];
		public innerNotes: Array<string|Node> = [];
		public errorNotes: Array<string|Node> = [];
		
		public constructor(
			public readonly offset: int,
			public readonly bytes: Uint8Array) {}
		
	}
	
	
	class SignaturePart extends FilePart {
		
		public constructor(
				offset: int,
				bytes: Uint8Array) {
			super(offset, bytes);
			
			this.outerNotes.push("Special: File signature");
			this.outerNotes.push(`Length: ${uintToStrWithThousandsSeparators(bytes.length)} bytes`);
			this.innerNotes.push(`\u201C${bytesToReadableString(bytes)}\u201D`);
			
			for (let i = 0; i < SignaturePart.FILE_SIGNATURE.length && this.errorNotes.length == 0; i++) {
				if (i >= bytes.length)
					this.errorNotes.push("Premature EOF");
				else if (bytes[i] != SignaturePart.FILE_SIGNATURE[i])
					this.errorNotes.push("Value mismatch");
			}
		}
		
		public static FILE_SIGNATURE: Array<byte> = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
		
	}
	
	
	class UnknownPart extends FilePart {
		
		public constructor(
				offset: int,
				bytes: Uint8Array) {
			super(offset, bytes);
			this.outerNotes.push("Special: Unknown");
			this.outerNotes.push(`Length: ${uintToStrWithThousandsSeparators(bytes.length)} bytes`);
		}
		
	}
	
	
	
	class ChunkPart extends FilePart {
		
		public typeStr: string = "";
		private isDataComplete: boolean = false;
		public data: Uint8Array = new Uint8Array();
		
		
		public constructor(
				offset: int,
				bytes: Uint8Array) {
			super(offset, bytes);
			
			if (bytes.length < 4) {
				this.outerNotes.push("Data length: Unfinished");
				this.errorNotes.push("Premature EOF");
				return;
			}
			
			const dataLen: int = readUint32(bytes, 0);
			this.outerNotes.push(`Data length: ${uintToStrWithThousandsSeparators(dataLen)} bytes`);
			if (dataLen > ChunkPart.MAX_DATA_LENGTH)
				this.errorNotes.push("Length out of range");
			else if (bytes.length < dataLen + 12)
				this.errorNotes.push("Premature EOF");
			
			if (bytes.length < 8) {
				this.outerNotes.push("Type: Unfinished");
				return;
			}
			
			{
				const typeBytes: Uint8Array = bytes.subarray(4, 8);
				this.typeStr = bytesToReadableString(typeBytes);
				if (!/^[A-Za-z]{4}$/.test(this.typeStr))
					this.errorNotes.push("Type contains non-alphabetic characters");
				const typeInfo = this.getTypeInfo();
				if (typeInfo !== null) {
					let frag: DocumentFragment = document.createDocumentFragment();
					frag.append("Type: ");
					let a = requireType(appendElem(frag, "a", this.typeStr), HTMLAnchorElement);
					a.href = typeInfo[2];
					a.target = "_blank";
					this.outerNotes.push(frag);
				} else
					this.outerNotes.push("Type: " + this.typeStr);
				const typeName: string = typeInfo !== null ? typeInfo[0] : "Unknown";
				this.outerNotes.push(
					"Name: " + typeName,
					(typeBytes[0] & 0x20) == 0 ? "Critical (0)"       : "Ancillary (1)"   ,
					(typeBytes[1] & 0x20) == 0 ? "Public (0)"         : "Private (1)"     ,
					(typeBytes[2] & 0x20) == 0 ? "Reserved (0)"       : "Unknown (1)"     ,
					(typeBytes[3] & 0x20) == 0 ? "Unsafe to copy (0)" : "Safe to copy (1)",
				);
			}
			
			if (dataLen > ChunkPart.MAX_DATA_LENGTH)
				return;
			
			if (bytes.length < dataLen + 12)
				this.outerNotes.push("CRC-32: Unfinished");
			else {
				const storedCrc: int = readUint32(bytes, bytes.length - 4);
				this.outerNotes.push(`CRC-32: ${storedCrc.toString(16).padStart(8,"0").toUpperCase()}`);
				const dataCrc: int = calcCrc32(bytes.subarray(4, bytes.length - 4));
				if (dataCrc != storedCrc)
					this.errorNotes.push(`CRC-32 mismatch (calculated from data: ${dataCrc.toString(16).padStart(8,"0").toUpperCase()})`);
			}
			
			this.isDataComplete = 8 + dataLen <= bytes.length;
			this.data = bytes.subarray(8, Math.min(8 + dataLen, bytes.length));
		}
		
		
		public annotate(earlierChunks: Readonly<Array<ChunkPart>>): void {
			if (this.innerNotes.length > 0)
				throw new Error("Already annotated");
			if (!this.isDataComplete)
				return;
			const temp = this.getTypeInfo();
			if (temp !== null)
				temp[3](this, earlierChunks);
		}
		
		
		// The maximum length of a chunk's payload data, in bytes, inclusive.
		public static MAX_DATA_LENGTH: int = 0x7FFF_FFFF;
		
		
		public getTypeInfo(): [string,boolean,string,((chunk:ChunkPart,earlier:Readonly<Array<ChunkPart>>)=>void)]|null {
			let result: [string,boolean,string,((chunk:ChunkPart,earlier:Readonly<Array<ChunkPart>>)=>void)]|null = null;
			for (const [type, name, multiple, url, func] of ChunkPart.TYPE_HANDLERS) {
				if (type == this.typeStr) {
					if (result !== null)
						throw new Error("Table has duplicate keys");
					result = [name, multiple, url, func];
				}
			}
			return result;
		}
		
		
		
		/*---- Handlers and metadata for all known PNG chunk types ----*/
		
		private static TYPE_HANDLERS: Array<[string,string,boolean,string,((chunk:ChunkPart,earlier:Readonly<Array<ChunkPart>>)=>void)]> = [
			
			["acTL", "Animation control", false, "https://wiki.mozilla.org/APNG_Specification#.60acTL.60:_The_Animation_Control_Chunk", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				addErrorIfHasType(earlier, "fcTL", chunk, "Chunk must be before fcTL chunk");
				addErrorIfHasType(earlier, "fdAT", chunk, "Chunk must be before fdAT chunk");
				
				if (chunk.data.length != 8) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const numFrames: int = readUint32(chunk.data, 0);
				const numPlays : int = readUint32(chunk.data, 4);
				chunk.innerNotes.push(`Number of frames: ${numFrames}`);
				if (!(1 <= numFrames && numFrames <= 0x7FFF_FFFF))
					chunk.errorNotes.push("Number of frames out of range");
				chunk.innerNotes.push(`Number of plays: ${numPlays == 0 ? 'Infinite (0)' : numPlays}`);
				if (numPlays > 0x7FFF_FFFF)
					chunk.errorNotes.push("Number of plays out of range");
			}],
			
			
			["bKGD", "Background color", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11bKGD", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(earlier);
				if (ihdr === null)
					return;
				const bitDepth : byte = ihdr[8];
				const colorType: byte = ihdr[9];
				
				if (colorType == 3) {
					if (chunk.data.length != 1) {
						chunk.errorNotes.push("Invalid data length");
						return;
					}
					const paletteIndex: byte = chunk.data[0];
					chunk.innerNotes.push(`Palette index: ${paletteIndex}`);
					const plteNumEntries: int|null = ChunkPart.getValidPlteNumEntries(earlier);
					if (plteNumEntries === null)
						return;
					if (paletteIndex >= plteNumEntries)
						chunk.errorNotes.push("Color index out of range");
					
				} else {
					if ((colorType == 0 || colorType == 4) && chunk.data.length != 2)
						chunk.errorNotes.push("Invalid data length");
					else if ((colorType == 2 || colorType == 6) && chunk.data.length != 6)
						chunk.errorNotes.push("Invalid data length");
					else {
						if (colorType == 0 || colorType == 4)
							chunk.innerNotes.push(`White: ${readUint16(chunk.data,0)}`);
						else if (colorType == 2 || colorType == 6) {
							chunk.innerNotes.push(
								  `Red: ${readUint16(chunk.data,0)}`,
								`Green: ${readUint16(chunk.data,2)}`,
								 `Blue: ${readUint16(chunk.data,4)}`,
							);
						}
						for (let i = 0; i < chunk.data.length; i += 2) {
							if (readUint16(chunk.data, i) >= (1 << bitDepth))
								chunk.errorNotes.push("Color value out of range");
						}
					}
				}
			}],
			
			
			["cHRM", "Primary chromaticities", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11cHRM", (chunk, earlier) => {
				addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length != 32) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				let offset: int = 0;
				for (const item of ["White point", "Red", "Green", "Blue"]) {
					for (const axis of ["x", "y"]) {
						const val: int = readUint32(chunk.data, offset);
						let s: string = val.toString().padStart(6, "0");
						s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
						// s basically equals (val/100000).toFixed(5)
						chunk.innerNotes.push(`${item} ${axis}: ${s}`);
						if (val > 0x7FFF_FFFF)
							chunk.errorNotes.push(`${item} ${axis} value out of range`);
						offset += 4;
					}
				}
			}],
			
			
			["dSIG", "Digital signature", true, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#RC.dSIG", (chunk, earlier) => {}],
			
			
			["eXIf", "Exchangeable Image File (Exif) Profile", false, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.eXIf", (chunk, earlier) => {}],
			
			
			["fcTL", "Frame control", true, "https://wiki.mozilla.org/APNG_Specification#.60fcTL.60:_The_Frame_Control_Chunk", (chunk, earlier) => {
				if (chunk.data.length != 26) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const sequence: int = readUint32(chunk.data,  0);
				const width   : int = readUint32(chunk.data,  4);
				const height  : int = readUint32(chunk.data,  8);
				const xOffset : int = readUint32(chunk.data, 12);
				const yOffset : int = readUint32(chunk.data, 16);
				const delayNumerator  : int = readUint16(chunk.data, 20);
				const delayDenominator: int = readUint16(chunk.data, 22);
				const disposeOp: int = chunk.data[24];
				const blendOp  : int = chunk.data[25];
				
				const effectiveDenominator: int = delayDenominator == 0 ? 100 : delayDenominator;
				let frag: DocumentFragment = document.createDocumentFragment();
				frag.append(`Delay: ${delayNumerator * 1000 % effectiveDenominator == 0 ? "" : "\u2248"}${(delayNumerator / effectiveDenominator).toFixed(3)} `);
				let abbr = appendElem(frag, "abbr", "s");
				abbr.title = "seconds";
				chunk.innerNotes.push(
					`Sequence number: ${sequence}`,
					`Width: ${width} pixels`,
					`Height: ${height} pixels`,
					`X offset: ${xOffset} pixels`,
					`Y offset: ${yOffset} pixels`,
					`Delay numerator: ${delayNumerator}`,
					`Delay denominator: ${delayDenominator == 0 ? "100 (0)" : delayDenominator}`,
					frag);
				
				if (sequence > 0x7FFF_FFFF)
					chunk.errorNotes.push("Sequence number out of range");
				const expectSequence: int = earlier.filter(ch => ch.typeStr == "fcTL" || ch.typeStr == "fdAT").length;
				if (sequence != expectSequence)
					chunk.errorNotes.push(`Invalid sequence number (should be ${expectSequence})`);
				
				let widthMin  : int = 1, widthMax  : int = 0x7FFF_FFFF;
				let heightMin : int = 1, heightMax : int = 0x7FFF_FFFF;
				let xOffsetMin: int = 0, xOffsetMax: int = 0x7FFF_FFFF;
				let yOffsetMin: int = 0, yOffsetMax: int = 0x7FFF_FFFF;
				const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(earlier);
				if (ihdr !== null) {
					widthMax  = readUint32(ihdr, 0);
					heightMax = readUint32(ihdr, 4);
					if (expectSequence == 0 && !earlier.some(ch => ch.typeStr == "IDAT")) {  // This foremost fcTL is in front of IDAT
						widthMin  = widthMax;
						heightMin = heightMax;
						xOffsetMax = 0;
						yOffsetMax = 0;
					} else {
						xOffsetMax = widthMax  - width ;
						yOffsetMax = heightMax - height;
					}
				}
				if (!(widthMin <= width && width <= widthMax))
					chunk.errorNotes.push("Width out of range");
				if (!(heightMin <= height && height <= heightMax))
					chunk.errorNotes.push("Height out of range");
				if (!(xOffsetMin <= xOffset && xOffset <= xOffsetMax))
					chunk.errorNotes.push("X offset out of range");
				if (!(yOffsetMin <= yOffset && yOffset <= yOffsetMax))
					chunk.errorNotes.push("Y offset out of range");
				
				{
					let s: string|null = lookUpTable(disposeOp, [
						[0, "None"      ],
						[1, "Background"],
						[2, "Previous"  ],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown dispose operation");
					}
					chunk.innerNotes.push(`Dispose operation: ${s} (${disposeOp})`);
				}
				
				{
					let s: string|null = lookUpTable(blendOp, [
						[0, "Source"],
						[1, "Over"  ],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown blend operation");
					}
					chunk.innerNotes.push(`Blend operation: ${s} (${blendOp})`);
				}
			}],
			
			
			["fdAT", "Frame data", true, "https://wiki.mozilla.org/APNG_Specification#.60fdAT.60:_The_Frame_Data_Chunk", (chunk, earlier) => {
				if (chunk.data.length < 4) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const sequence: int = readUint32(chunk.data, 0);
				chunk.innerNotes.push(`Sequence number: ${sequence}`);
				if (sequence > 0x7FFF_FFFF)
					chunk.errorNotes.push("Sequence number out of range");
				chunk.innerNotes.push(`Frame data length: ${chunk.data.length - 4} bytes`);
			}],
			
			
			["fRAc", "Fractal image parameters", true, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#RC.fRAc", (chunk, earlier) => {}],
			
			
			["gAMA", "Image gamma", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11gAMA", (chunk, earlier) => {
				addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length != 4) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const gamma: int = readUint32(chunk.data, 0);
				let s: string = gamma.toString().padStart(6, "0");
				s = s.substring(0, s.length - 5) + "." + s.substring(s.length - 5);
				// s basically equals (gamma/100000).toFixed(5)
				chunk.innerNotes.push(`Gamma: ${s}`);
				if (gamma > 0x7FFF_FFFF)
					chunk.errorNotes.push("Gamma value out of range");
			}],
			
			
			["gIFg", "GIF Graphic Control Extension", true, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.gIFg", (chunk, earlier) => {
				if (chunk.data.length != 4) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const disposalMethod: byte = chunk.data[0];
				const userInputFlag : byte = chunk.data[1];
				const delayTime: int = readUint16(chunk.data, 2);
				chunk.innerNotes.push(`Disposal method: ${disposalMethod}`);
				chunk.innerNotes.push(`User input flag: ${userInputFlag}`);
				let s: string = delayTime.toString().padStart(3, "0");
				s = s.substring(0, s.length - 2) + "." + s.substring(s.length - 2);
				// s basically equals (delayTime/100).toFixed(2)
				chunk.innerNotes.push(`Delay time: ${s} s`);
			}],
			
			
			["gIFt", "GIF Plain Text Extension", true, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#DC.gIFt", (chunk, earlier) => {
				if (chunk.data.length < 24) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const gridLeft  : int = readInt32(chunk.data,  0);
				const gridTop   : int = readInt32(chunk.data,  4);
				const gridWidth : int = readInt32(chunk.data,  8);
				const gridHeight: int = readInt32(chunk.data, 12);
				const cellWidth : byte = chunk.data[16];
				const cellHeight: byte = chunk.data[17];
				const foregroundColor: int = chunk.data[18] << 16 | chunk.data[19] << 8 | chunk.data[20] << 0;
				const backgroundColor: int = chunk.data[21] << 16 | chunk.data[22] << 8 | chunk.data[23] << 0;
				const text: string = bytesToReadableString(chunk.data.subarray(24));
				chunk.innerNotes.push(
					`Deprecated`,
					`Text grid left position: ${gridLeft.toString().replace(/-/,"\u2212")}`,
					`Text grid top position: ${gridTop.toString().replace(/-/,"\u2212")}`,
					`Text grid width: ${gridWidth.toString().replace(/-/,"\u2212")}`,
					`Text grid height: ${gridHeight.toString().replace(/-/,"\u2212")}`,
					`Character cell width: ${cellWidth}`,
					`Character cell height: ${cellHeight}`,
					`Text foreground color: #${foregroundColor.toString(16).padStart(2,"0")}`,
					`Text background color: #${backgroundColor.toString(16).padStart(2,"0")}`,
					`Plain text data: ${text}`,
				);
				if (gridLeft == -0x8000_0000)
					chunk.errorNotes.push("Text grid left position out of range");
				if (gridTop == -0x8000_0000)
					chunk.errorNotes.push("Text grid top position out of range");
				if (gridWidth == -0x8000_0000)
					chunk.errorNotes.push("Text grid width out of range");
				if (gridHeight == -0x8000_0000)
					chunk.errorNotes.push("Text grid height out of range");
			}],
			
			
			["gIFx", "GIF Application Extension", true, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.gIFx", (chunk, earlier) => {
				if (chunk.data.length < 11) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				chunk.innerNotes.push(`Application identifier: ${bytesToReadableString(chunk.data.subarray(0, 8))}`);
				{
					let hex: Array<string> = [];
					for (let i = 0; i < 3; i++)
						hex.push(chunk.data[8 + i].toString(16).padStart(2, "0"));
					chunk.innerNotes.push(`Authentication code: ${hex.join(" ")}`);
				}
				{
					let hex: Array<string> = [];
					for (const b of chunk.data.subarray(11))
						hex.push(b.toString(16).padStart(2, "0"));
					chunk.innerNotes.push(`Application data: ${hex.join(" ")}`);
				}
			}],
			
			
			["hIST", "Image histogram", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11hIST", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				if (!earlier.some(ch => ch.typeStr == "PLTE"))
					chunk.errorNotes.push("Chunk requires earlier PLTE chunk");
				
				if (chunk.data.length % 2 != 0) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const numEntries: int = chunk.data.length / 2;
				chunk.innerNotes.push(`Number of entries: ${numEntries}`);
				const plteNumEntries: int|null = ChunkPart.getValidPlteNumEntries(earlier);
				if (plteNumEntries === null)
					return;
				if (numEntries != plteNumEntries)
					chunk.errorNotes.push("Invalid data length");
			}],
			
			
			["iCCP", "Embedded ICC profile", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11iCCP", (chunk, earlier) => {
				addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				addErrorIfHasType(earlier, "sRGB", chunk, "Chunk should not exist because sRGB chunk exists");
				const parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
				
				const name: string = decodeIso8859_1(parts[0]);
				annotateTextKeyword(name, false, "Profile name", "name", chunk);
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				if (parts[1].length < 1) {
					chunk.errorNotes.push("Missing compression method");
					return;
				}
				const compMeth: byte = parts[1][0];
				let s: string|null = lookUpTable(compMeth, COMPRESSION_METHODS);
				if (s === null) {
					s = "Unknown";
					chunk.errorNotes.push("Unknown compression method");
				}
				chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
				const compProfile: Uint8Array = parts[1].slice(1);
				chunk.innerNotes.push(`Compressed profile size: ${compProfile.length}`);
				if (compMeth == 0) {
					try {
						const decompProfile: Uint8Array = decompressZlibDeflate(compProfile);
						chunk.innerNotes.push(`Decompressed profile size: ${decompProfile.length}`);
					} catch (e) {
						chunk.errorNotes.push("Profile decompression error: " + e.message);
					}
				}
			}],
			
			
			["IDAT", "Image data", true, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11IDAT", (chunk, earlier) => {
				if (earlier.length > 0 && earlier[earlier.length - 1].typeStr != "IDAT"
						&& earlier.some(ch => ch.typeStr == "IDAT")) {
					chunk.errorNotes.push("Non-consecutive IDAT chunk");
				}
			}],
			
			
			["IEND", "Image trailer", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11IEND", (chunk, earlier) => {
				if (chunk.data.length != 0)
					chunk.errorNotes.push("Non-empty data");
			}],
			
			
			["IHDR", "Image header", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR", (chunk, earlier) => {
				if (chunk.data.length != 13) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const width : int = readUint32(chunk.data, 0);
				const height: int = readUint32(chunk.data, 4);
				const bitDepth : byte = chunk.data[ 8];
				const colorType: byte = chunk.data[ 9];
				const compMeth : byte = chunk.data[10];
				const filtMeth : byte = chunk.data[11];
				const laceMeth : byte = chunk.data[12];
				
				chunk.innerNotes.push(`Width: ${width} pixels`);
				if (width == 0 || width > 0x7FFF_FFFF)
					chunk.errorNotes.push("Width out of range");
				chunk.innerNotes.push(`Height: ${height} pixels`);
				if (height == 0 || height > 0x7FFF_FFFF)
					chunk.errorNotes.push("Height out of range");
				
				{
					let colorTypeStr: string;
					let validBitDepths: Array<int>;
					const temp: [string,Array<int>]|null = lookUpTable(colorType, [
						[0, ["Grayscale"      ,  [1, 2, 4, 8, 16]]],
						[2, ["RGB"            ,  [8, 16]         ]],
						[3, ["Palette"        ,  [1, 2, 4, 8]    ]],
						[4, ["Grayscale+Alpha",  [8, 16]         ]],
						[6, ["RGBA"           ,  [8, 16]         ]],
					]);
					colorTypeStr   = temp !== null ? temp[0] : "Unknown";
					validBitDepths = temp !== null ? temp[1] : []       ;
					chunk.innerNotes.push(`Bit depth: ${bitDepth} bits per ${colorType!=3?"channel":"pixel"}`);
					chunk.innerNotes.push(`Color type: ${colorTypeStr} (${colorType})`);
					if (temp === null)
						chunk.errorNotes.push("Unknown color type");
					else if (!validBitDepths.includes(bitDepth))
						chunk.errorNotes.push("Invalid bit depth");
				}
				{
					let s: string|null = lookUpTable(compMeth, COMPRESSION_METHODS);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown compression method");
					}
					chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
				}
				{
					let s: string|null = lookUpTable(filtMeth, [
						[0, "Adaptive"],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown filter method");
					}
					chunk.innerNotes.push(`Filter method: ${s} (${filtMeth})`);
				}
				{
					let s: string|null = lookUpTable(laceMeth, [
						[0, "None" ],
						[1, "Adam7"],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown interlace method");
					}
					chunk.innerNotes.push(`Interlace method: ${s} (${laceMeth})`);
				}
			}],
			
			
			["iTXt", "International textual data", true, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11iTXt", (chunk, earlier) => {
				let parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
				
				const keyword: string = decodeIso8859_1(parts[0]);
				annotateTextKeyword(keyword, true, "Keyword", "keyword", chunk);
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				if (parts[1].length < 1) {
					chunk.errorNotes.push("Missing compression flag");
					return;
				}
				const compFlag: byte = parts[1][0];
				{
					let s: string|null = lookUpTable(compFlag, [
						[0, "Uncompressed"],
						[1, "Compressed"  ],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown compression flag");
					}
					chunk.innerNotes.push(`Compression flag: ${s} (${compFlag})`);
				}
				if (parts[1].length < 2) {
					chunk.errorNotes.push("Missing compression method");
					return;
				}
				let compMeth: byte = parts[1][1];
				{
					let s: string|null = null;
					if (compFlag == 0 && compMeth == 0)
						s = "Uncompressed";
					else if (compFlag == 1)
						s = lookUpTable(compMeth, COMPRESSION_METHODS);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown compression method");
					}
					chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
				}
				
				parts = splitByNull(parts[1].slice(2), 3);
				{
					const langTag: string = decodeIso8859_1(parts[0]);
					chunk.innerNotes.push(`Language tag: ${langTag}`);
					if (!/^(?:[A-Za-z0-9]{1,8}(?:-[A-Za-z0-9]{1,8})*)?$/.test(langTag))
						chunk.errorNotes.push("Invalid language tax syntax");
				}
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				try {
					const transKey: string = decodeUtf8(parts[1]);
					chunk.innerNotes.push(`Translated keyword: ${transKey}`);
				} catch (e) {
					chunk.errorNotes.push("Invalid UTF-8 in translated keyword");
				}
				if (parts.length == 2) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				let textBytes: Uint8Array|null = null;
				switch (compFlag) {
					case 0:  // Uncompressed
						textBytes = parts[2];
						break;
					case 1:
						if (compMeth == 0) {
							try {
								textBytes = decompressZlibDeflate(parts[2]);
							} catch (e) {
								chunk.errorNotes.push("Text decompression error: " + e.message);
							}
						}
						break;
				}
				if (textBytes === null)
					return;
				try {
					const text: string = decodeUtf8(textBytes);
					let frag: DocumentFragment = document.createDocumentFragment();
					frag.append("Text string: ");
					let span: HTMLElement = appendElem(frag, "span", text);
					span.style.wordBreak = "break-all";
					chunk.innerNotes.push(frag);
				} catch (e) {
					chunk.errorNotes.push("Invalid UTF-8 in text string");
				}
			}],
			
			
			["oFFs", "Image offset", false, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.oFFs", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length != 9) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const xPos: int = readInt32(chunk.data, 0);
				const yPos: int = readInt32(chunk.data, 4);
				const unit: byte = chunk.data[8];
				chunk.innerNotes.push(`X position: ${xPos.toString().replace(/-/,"\u2212")} units`);
				chunk.innerNotes.push(`Y position: ${yPos.toString().replace(/-/,"\u2212")} units`);
				if (xPos == -0x8000_0000)
					chunk.errorNotes.push("X position out of range");
				if (yPos == -0x8000_0000)
					chunk.errorNotes.push("Y position out of range");
				{
					let s: string|null = lookUpTable(unit, [
						[0, "Pixel"     ],
						[1, "Micrometre"],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown unit specifier");
					}
					chunk.innerNotes.push(`Unit specifier: ${s} (${unit})`);
				}
			}],
			
			
			["pCAL", "Calibration of pixel values", false, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.pCAL", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				let parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
				const calibrationName: string = decodeIso8859_1(parts[0]);
				annotateTextKeyword(calibrationName, true, "Calibration name", "name", chunk);
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				const originalZero: int = readInt32(parts[1], 0);
				const originalMax : int = readInt32(parts[1], 4);
				chunk.innerNotes.push(`Original zero: ${originalZero.toString().replace(/-/,"\u2212")}`);
				chunk.innerNotes.push(`Original max: ${originalMax.toString().replace(/-/,"\u2212")}`);
				if (originalZero == -0x8000_0000)
					chunk.errorNotes.push("Original zero out of range");
				if (originalMax == -0x8000_0000)
					chunk.errorNotes.push("Original max out of range");
				if (originalZero == originalMax)
					chunk.errorNotes.push("Zero original range");
				
				const equationType: int = parts[1][8];
				let s: string|null = lookUpTable(equationType, [
					[0, "Linear"                    ],
					[1, "Base-e exponential"        ],
					[2, "Arbitrary-base exponential"],
					[3, "Hyperbolic"                ],
				]);
				if (s === null) {
					s = "Unknown";
					chunk.errorNotes.push("Unknown equation type");
				}
				if (equationType != 1)
					chunk.innerNotes.push(`Equation type: ${s} (${equationType})`);
				else {
					let frag: DocumentFragment = document.createDocumentFragment();
					frag.append("Equation type: Base-");
					appendElem(frag, "var", "e");
					frag.append(" exponential (1)");
					chunk.innerNotes.push(frag);
				}
				
				const numParameters: int = parts[1][9];
				const expectNumParams: int|null = lookUpTable(equationType, [
					[0, 2],
					[1, 2],
					[2, 3],
					[3, 4],
				]);
				if (expectNumParams !== null && expectNumParams != numParameters)
					chunk.errorNotes.push("Invalid number of parameters for equation type");
				chunk.innerNotes.push(`Number of parameters: ${numParameters}`);
				
				parts = splitByNull(parts[1].slice(10), numParameters + 1);
				const unitName: string = decodeIso8859_1(parts[0]);
				chunk.innerNotes.push(`Unit name: ${unitName}`);
				if (unitName.includes("\uFFFD"))
					chunk.errorNotes.push("Invalid ISO 8859-1 byte in unit name");
				parts.slice(1).forEach((part, i) => {
					const param: string = decodeIso8859_1(part);
					chunk.innerNotes.push(`Parameter ${i}: ${param}`);
					if (!/^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(param))
						chunk.errorNotes.push(`Invalid parameter ${i} floating-point string`);
				});
				if (parts.length != numParameters + 1)
					chunk.errorNotes.push("Missing null separator");
			}],
			
			
			["pHYs", "Physical pixel dimensions", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11pHYs", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length != 9) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const horzRes: int = readUint32(chunk.data, 0);
				const vertRes: int = readUint32(chunk.data, 4);
				const unit: byte = chunk.data[8];
				for (const [dir, val] of ([["Horizontal", horzRes], ["Vertical", vertRes]] as Array<[string,int]>)) {
					let frag: DocumentFragment = document.createDocumentFragment();
					frag.append(`${dir} resolution: ${val} pixels per unit`);
					if (unit == 1) {
						frag.append(` (\u2248 ${(val*0.0254).toFixed(0)} `);
						let abbr = appendElem(frag, "abbr", "DPI");
						abbr.title = "dots per inch";
						frag.append(")");
					}
					chunk.innerNotes.push(frag);
					if (val > 0x7FFF_FFFF)
						chunk.errorNotes.push(dir + " resolution out of range");
				}
				{
					let s: string|null = lookUpTable(unit, [
						[0, "Arbitrary (aspect ratio only)"],
						[1, "Metre"                        ],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown unit specifier");
					}
					chunk.innerNotes.push(`Unit specifier: ${s} (${unit})`);
				}
			}],
			
			
			["PLTE", "Palette", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11PLTE", (chunk, earlier) => {
				addErrorIfHasType(earlier, "bKGD", chunk, "Chunk must be before bKGD chunk");
				addErrorIfHasType(earlier, "hIST", chunk, "Chunk must be before hIST chunk");
				addErrorIfHasType(earlier, "tRNS", chunk, "Chunk must be before tRNS chunk");
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length % 3 != 0) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const numEntries: int = Math.ceil(chunk.data.length / 3);
				chunk.innerNotes.push(`Number of entries: ${numEntries}`);
				if (numEntries == 0)
					chunk.errorNotes.push("Empty palette");
				
				const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(earlier);
				if (ihdr === null)
					return;
				const bitDepth : byte = ihdr[8];
				const colorType: byte = ihdr[9];
				if (colorType == 0 || colorType == 4)
					chunk.errorNotes.push("Palette disallowed for grayscale color type");
				if (colorType == 3 && numEntries > (1 << bitDepth))
					chunk.errorNotes.push("Number of palette entries exceeds bit depth");
			}],
			
			
			["sCAL", "Physical scale of image subject", false, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.sCAL", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length < 1) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				{
					const unit: byte = chunk.data[0];
					let s: string|null = lookUpTable(unit, [
						[0, "Metre" ],
						[1, "Radian"],
					]);
					if (s === null) {
						s = "Unknown";
						chunk.errorNotes.push("Unknown unit specifier");
					}
					chunk.innerNotes.push(`Unit specifier: ${s} (${unit})`);
				}
				
				const parts: Array<Uint8Array> = splitByNull(chunk.data.slice(1), 2);
				const ASCII_FLOAT: RegExp = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
				{
					const width: string = decodeIso8859_1(parts[0]);
					chunk.innerNotes.push(`Pixel width: ${width} units`)
					const match: Array<string>|null = ASCII_FLOAT.exec(width);
					if (match === null)
						chunk.errorNotes.push("Invalid width floating-point string");
					else if (match[1] == "-" || !/[1-9]/.test(match[2]))
						chunk.errorNotes.push("Non-positive width");
				}
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				{
					const height: string = decodeIso8859_1(parts[1]);
					chunk.innerNotes.push(`Pixel height: ${height} units`)
					const match: Array<string>|null = ASCII_FLOAT.exec(height);
					if (match === null)
						chunk.errorNotes.push("Invalid height floating-point string");
					else if (match[1] == "-" || !/[1-9]/.test(match[2]))
						chunk.errorNotes.push("Non-positive height");
				}
			}],
			
			
			["sBIT", "Significant bits", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11sBIT", (chunk, earlier) => {
				addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(earlier);
				if (ihdr === null)
					return;
				const colorType: byte = ihdr[9];
				const bitDepth: byte = colorType != 3 ? ihdr[8] : 8;
				
				const channels: Array<string>|null = lookUpTable(colorType, [
					[0, ["White"]                        ],
					[2, ["Red", "Green", "Blue"]         ],
					[3, ["Red", "Green", "Blue"]         ],
					[4, ["White", "Alpha"]               ],
					[6, ["Red", "Green", "Blue", "Alpha"]],
				]);
				if (channels === null)
					return;
				if (chunk.data.length != channels.length) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				let hasChanErr: boolean = false;
				channels.forEach((chan: string, i: int) => {
					const bits: int = chunk.data[i];
					chunk.innerNotes.push(`${chan} bits: ${bits}`);
					if (!hasChanErr && !(1 <= bits && bits <= bitDepth)) {
						chunk.errorNotes.push("Bit depth out of range");
						hasChanErr = true;
					}
				});
			}],
			
			
			["sPLT", "Suggested palette", true, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11sPLT", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				const parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
				
				const name: string = decodeIso8859_1(parts[0]);
				annotateTextKeyword(name, true, "Palette name", "name", chunk);
				if (ChunkPart.getSpltNames(earlier).has(name))
					chunk.errorNotes.push("Duplicate palette name");
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				if (parts[1].length < 1) {
					chunk.errorNotes.push("Missing sample depth");
					return;
				}
				const sampDepth: byte = parts[1][0];
				chunk.innerNotes.push(`Sample depth: ${sampDepth}`);
				
				const bytesPerEntry: int|null = lookUpTable(sampDepth, [
					[ 8,  6],
					[16, 10],
				]);
				if (bytesPerEntry === null)
					return;
				else if ((parts[1].length - 1) % bytesPerEntry == 0)
					chunk.innerNotes.push(`Number of entries: ${(parts[1].length-1)/bytesPerEntry}`);
				else
					chunk.errorNotes.push("Invalid data length");
			}],
			
			
			["sRGB", "Standard RGB color space", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11sRGB", (chunk, earlier) => {
				addErrorIfHasType(earlier, "PLTE", chunk, "Chunk must be before PLTE chunk");
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				addErrorIfHasType(earlier, "iCCP", chunk, "Chunk should not exist because iCCP chunk exists");
				
				if (chunk.data.length != 1) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const renderIntent: byte = chunk.data[0];
				let s: string|null = lookUpTable(renderIntent, [
					[0, "Perceptual"           ],
					[1, "Relative colorimetric"],
					[2, "Saturation"           ],
					[3, "Absolute colorimetric"],
				]);
				if (s === null) {
					s = "Unknown";
					chunk.errorNotes.push("Unknown rendering intent");
				}
				chunk.innerNotes.push(`Rendering intent: ${s} (${renderIntent})`);
			}],
			
			
			["sTER", "Indicator of Stereo Image", false, "https://ftp-osl.osuosl.org/pub/libpng/documents/pngext-1.5.0.html#C.sTER", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				if (chunk.data.length != 1) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const mode: byte = chunk.data[0];
				let s: string|null = lookUpTable(mode, [
					[0, "Cross-fuse layout"    ],
					[1, "Diverging-fuse layout"],
				]);
				if (s === null) {
					s = "Unknown";
					chunk.errorNotes.push("Unknown mode");
				}
				chunk.innerNotes.push(`Mode: ${s} (${mode})`);
			}],
			
			
			["tEXt", "Textual data", true, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11tEXt", (chunk, earlier) => {
				const parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
				
				const keyword: string = decodeIso8859_1(parts[0]);
				annotateTextKeyword(keyword, true, "Keyword", "keyword", chunk);
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				const text: string = decodeIso8859_1(parts[1]);
				chunk.innerNotes.push(`Text string: ${text}`);
				if (text.includes("\u0000"))
					chunk.errorNotes.push("Null character in text string");
				if (text.includes("\uFFFD"))
					chunk.errorNotes.push("Invalid ISO 8859-1 byte in text string");
			}],
			
			
			["tIME", "Image last-modification time", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11tIME", (chunk, earlier) => {
				if (chunk.data.length != 7) {
					chunk.errorNotes.push("Invalid data length");
					return;
				}
				const year  : int = readUint16(chunk.data, 0);
				const month : byte = chunk.data[2];
				const day   : byte = chunk.data[3];
				const hour  : byte = chunk.data[4];
				const minute: byte = chunk.data[5];
				const second: byte = chunk.data[6];
				chunk.innerNotes.push(
					`Year: ${year}`,
					`Month: ${month}`,
					`Day: ${day}`,
					`Hour: ${hour}`,
					`Minute: ${minute}`,
					`Second: ${second}`,
				);
				if (!(1 <= month && month <= 12))
					chunk.errorNotes.push("Invalid month");
				if (!(1 <= day && day <= 31) || 1 <= month && month <= 12 && day > new Date(year, month, 0).getDate())
					chunk.errorNotes.push("Invalid day");
				if (!(0 <= hour && hour <= 23))
					chunk.errorNotes.push("Invalid hour");
				if (!(0 <= minute && minute <= 59))
					chunk.errorNotes.push("Invalid minute");
				if (!(0 <= second && second <= 60))
					chunk.errorNotes.push("Invalid second");
			}],
			
			
			["tRNS", "Transparency", false, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11tRNS", (chunk, earlier) => {
				addErrorIfHasType(earlier, "IDAT", chunk, "Chunk must be before IDAT chunk");
				
				const ihdr: Uint8Array|null = ChunkPart.getValidIhdrData(earlier);
				if (ihdr === null)
					return;
				const bitDepth : byte = ihdr[8];
				const colorType: byte = ihdr[9];
				
				if (colorType == 4)
					chunk.errorNotes.push("Transparency chunk disallowed for gray+alpha color type");
				else if (colorType == 6)
					chunk.errorNotes.push("Transparency chunk disallowed for RGBA color type");
				else if (colorType == 3) {
					const numEntries: int = chunk.data.length;
					chunk.innerNotes.push(`Number of entries: ${numEntries}`);
					const plteNumEntries: int|null = ChunkPart.getValidPlteNumEntries(earlier);
					if (plteNumEntries === null)
						return;
					if (numEntries > plteNumEntries)
						chunk.errorNotes.push("Number of alpha values exceeds palette size");
					
				} else {
					if (colorType == 0 && chunk.data.length != 2)
						chunk.errorNotes.push("Invalid data length");
					else if (colorType == 2 && chunk.data.length != 6)
						chunk.errorNotes.push("Invalid data length");
					else {
						if (colorType == 0)
							chunk.innerNotes.push(`White: ${readUint16(chunk.data,0)}`);
						else if (colorType == 2) {
							chunk.innerNotes.push(
								  `Red: ${readUint16(chunk.data,0)}`,
								`Green: ${readUint16(chunk.data,2)}`,
								 `Blue: ${readUint16(chunk.data,4)}`,
							);
						}
						for (let i = 0; i < chunk.data.length; i += 2) {
							if (readUint16(chunk.data, i) >= (1 << bitDepth))
								chunk.errorNotes.push("Color value out of range");
						}
					}
				}
			}],
			
			
			["zTXt", "Compressed textual data", true, "https://www.w3.org/TR/2003/REC-PNG-20031110/#11zTXt", (chunk, earlier) => {
				const parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
				
				const keyword: string = decodeIso8859_1(parts[0]);
				annotateTextKeyword(keyword, true, "Keyword", "keyword", chunk);
				if (parts.length == 1) {
					chunk.errorNotes.push("Missing null separator");
					return;
				}
				
				if (parts[1].length < 1) {
					chunk.errorNotes.push("Missing compression method");
					return;
				}
				const compMeth: byte = parts[1][0];
				let s: string|null = lookUpTable(compMeth, COMPRESSION_METHODS);
				if (s === null) {
					s = "Unknown";
					chunk.errorNotes.push("Unknown compression method");
				}
				chunk.innerNotes.push(`Compression method: ${s} (${compMeth})`);
				if (compMeth == 0) {
					try {
						const textBytes: Uint8Array = decompressZlibDeflate(parts[1].slice(1));
						const text: string = decodeIso8859_1(textBytes);
						let frag: DocumentFragment = document.createDocumentFragment();
						frag.append("Text string: ");
						let span: HTMLElement = appendElem(frag, "span", text);
						span.style.wordBreak = "break-all";
						chunk.innerNotes.push(frag);
						if (text.includes("\uFFFD"))
							chunk.errorNotes.push("Invalid ISO 8859-1 byte in text string");
					} catch (e) {
						chunk.errorNotes.push("Text decompression error: " + e.message);
					}
				}
			}],
			
		];
		
		
		/*---- Helper functions ----*/
		
		public static getValidIhdrData(chunks: Readonly<Array<ChunkPart>>): Uint8Array|null {
			let result: Uint8Array|null = null;
			let count: int = 0;
			for (const chunk of chunks) {
				if (chunk.typeStr == "IHDR") {
					count++;
					if (chunk.data.length == 13)
						result = chunk.data;
				}
			}
			if (count != 1)
				result = null;
			return result;
		}
		
		
		public static getValidPlteNumEntries(chunks: Readonly<Array<ChunkPart>>): int|null {
			let result: int|null = null;
			let count: int = 0;
			for (const chunk of chunks) {
				if (chunk.typeStr == "PLTE") {
					count++;
					if (chunk.data.length % 3 == 0) {
						const numEntries: int = chunk.data.length / 3;
						if (1 <= numEntries && numEntries <= 256)
							result = numEntries;
					}
				}
			}
			if (count != 1)
				result = null;
			return result;
		}
		
		
		private static getSpltNames(chunks: Readonly<Array<ChunkPart>>): Set<string> {
			let result = new Set<string>();
			for (const chunk of chunks) {
				if (chunk.typeStr == "sPLT") {
					const parts: Array<Uint8Array> = splitByNull(chunk.data, 2);
					result.add(decodeIso8859_1(parts[0]));
				}
			}
			return result;
		}
		
	}
	
	
	
	/*---- Utility functions ----*/
	
	const COMPRESSION_METHODS: Array<[int,string]> = [
		[0, "DEFLATE"],
	];
	
	
	function annotateTextKeyword(keyword: string, checkSpaces: boolean, noteName: string, errorName: string, chunk: ChunkPart): void {
		chunk.innerNotes.push(`${noteName}: ${keyword}`);
		if (!(1 <= keyword.length && keyword.length <= 79))
			chunk.errorNotes.push(`Invalid ${errorName} length`);
		for (const ch of keyword) {
			const cc = ch.codePointAt(0) as int;
			if (0x20 <= cc && cc <= 0x7E || 0xA1 <= cc && cc <= 0xFF)
				continue;
			else {
				chunk.errorNotes.push(`Invalid character in ${errorName}`);
				break;
			}
		}
		if (checkSpaces && /^ |  | $/.test(keyword))
			chunk.errorNotes.push(`Invalid space in ${errorName}`);
	}
	
	
	function calcCrc32(bytes: Uint8Array): int {
		let crc: int = ~0;
		for (const b of bytes) {
			for (let i = 0; i < 8; i++) {
				crc ^= (b >>> i) & 1;
				crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
			}
		}
		return ~crc >>> 0;
	}
	
	
	function bytesToReadableString(bytes: Uint8Array): string {
		let result: string = "";
		for (const b of bytes) {
			let cc: int = b;
			if (b < 0x20)
				cc += 0x2400;
			else if (b == 0x7F)
				cc = 0x2421;
			else if (0x80 <= b && b < 0xA0)
				cc = 0x25AF;
			result += String.fromCodePoint(cc);
		}
		return result;
	}
	
	
	function decodeIso8859_1(bytes: Uint8Array): string {
		let result: string = "";
		for (const b of bytes) {
			if (!(0x00 <= b && b <= 0xFF))
				throw new RangeError("Invalid byte");
			else if (0x80 <= b && b < 0xA0)
				result += "\uFFFD";
			else
				result += String.fromCodePoint(b);  // ISO 8859-1 is a subset of Unicode
		}
		return result;
	}
	
	
	function decodeUtf8(bytes: Uint8Array): string {
		let temp: string = "";
		for (const b of bytes) {
			if (b == ("%".codePointAt(0) as int) || b >= 128)
				temp += "%" + b.toString(16).padStart(2, "0");
			else
				temp += String.fromCodePoint(b);
		}
		return decodeURI(temp);
	}
	
	
	function uintToStrWithThousandsSeparators(val: int): string {
		if (val < 0 || Math.floor(val) != val)
			throw new RangeError("Invalid unsigned integer");
		let result: string = val.toString();
		for (let i = result.length - 3; i > 0; i -= 3)
			result = result.substring(0, i) + "\u00A0" + result.substring(i);
		return result;
	}
	
	
	function addErrorIfHasType(earlier: Readonly<Array<ChunkPart>>, type: string, chunk: ChunkPart, message: string): void {
		if (earlier.some(ch => ch.typeStr == type))
			chunk.errorNotes.push(message);
	}
	
	
	function appendElem(container: Element|DocumentFragment, tagName: string, text?: string): HTMLElement {
		let result = document.createElement(tagName);
		container.append(result);
		if (text !== undefined)
			result.textContent = text;
		return result;
	}
	
	
	function lookUpTable<V>(key: int, table: Readonly<Array<[int,V]>>): V|null {
		let result: V|null = null;
		for (const [k, v] of table) {
			if (k == key) {
				if (result !== null)
					throw new RangeError("Table has duplicate keys");
				result = v;
			}
		}
		return result;
	}
	
	
	function splitByNull(bytes: Uint8Array, maxParts: int): Array<Uint8Array> {
		if (maxParts < 1)
			throw new RangeError("Non-positive number of parts");
		let result: Array<Uint8Array> = [];
		let start: int = 0;
		for (let i = 0; i < maxParts - 1; i++) {
			let end = bytes.indexOf(0, start);
			if (end == -1)
				break;
			result.push(bytes.slice(start, end));
			start = end + 1;
		}
		result.push(bytes.slice(start));
		return result;
	}
	
	
	function decompressZlibDeflate(bytes: Uint8Array): Uint8Array {
		if (bytes.length < 2)
			throw new RangeError("Invalid zlib container");
		const compMeth: int = bytes[0] & 0xF;
		const compInfo: int = bytes[0] >>> 4;
		const presetDict: boolean = (bytes[1] & 0x20) != 0;
		const compLevel: int = bytes[1] >>> 6;
		
		if ((bytes[0] << 8 | bytes[1]) % 31 != 0)
			throw new RangeError("zlib header checksum mismatch");
		if (compMeth != 8)
			throw new RangeError(`Unsupported compression method (${compMeth})`);
		if (compInfo > 7)
			throw new RangeError(`Unsupported compression info (${compInfo})`);
		if (presetDict)
			throw new RangeError("Unsupported preset dictionary");
		
		let input: deflate.BitInputStream = new deflate.BitInputStream(bytes.slice(2));
		const result: Uint8Array = deflate.Decompressor.decompress(input);
		let dataAdler: int;
		{
			let s1: int = 1;
			let s2: int = 0;
			for (const b of result) {
				s1 = (s1 + b) % 65521;
				s2 = (s2 + s1) % 65521;
			}
			dataAdler = s2 << 16 | s1;
		}
		
		let storedAdler: int = 0;
		for (let i = 0; i < 4; i++)
			storedAdler = storedAdler << 8 | input.readUint(8);
		if (storedAdler != dataAdler)
			throw new RangeError("Adler-32 mismatch");
		if (input.readBitMaybe() != -1)
			throw new RangeError("Unexpected data after zlib container");
		return result;
	}
	
	
	function readUint16(bytes: Uint8Array, offset: int): int {
		if (bytes.length - offset < 2)
			throw new RangeError("Index out of range");
		return bytes[offset + 0] << 8
		     | bytes[offset + 1] << 0;
	}
	
	
	function readUint32(bytes: Uint8Array, offset: int): int {
		if (offset < 0 || bytes.length - offset < 4)
			throw new RangeError("Index out of range");
		return (bytes[offset + 0] << 24
		      | bytes[offset + 1] << 16
		      | bytes[offset + 2] <<  8
		      | bytes[offset + 3] <<  0) >>> 0;
	}
	
	
	function readInt32(bytes: Uint8Array, offset: int): int {
		return readUint32(bytes, offset) | 0;
	}
	
	
	type Constructor<T> = { new(...args: Array<any>): T };
	
	function requireType<T>(val: unknown, type: Constructor<T>): T {
		if (val instanceof type)
			return val;
		else
			throw new TypeError("Invalid value type");
	}
	
}
