/* 
 * Step-by-step QR Code generation
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/
 */

"use strict";


namespace app {
	
	type bit = number;
	type byte = number;
	type int = number;
	
	
	
	function initialize(): void {
		doGenerate();
	}
	
	
	namespace maskShower {
		
		const MASK_DEPENDENT_ELEMS = [
			"mask-pattern",
			"masked-qr-code",
			"masked-qr-with-format",
			"horizontal-runs",
			"vertical-runs",
			"two-by-two-boxes",
			"horizontal-false-finders",
			"vertical-false-finders",
			"black-white-balance",
		];
		
		export let selectElem = getElem("show-mask") as HTMLSelectElement;
		
		for (let id of MASK_DEPENDENT_ELEMS)
			cloneElemPerMask(id);
		selectElem.onchange = showMask;
		showMask();
		
		export function showMask(): void {
			for (let id of MASK_DEPENDENT_ELEMS) {
				for (let i = 0; i < 8; i++) {
					let elem = document.getElementById(`${id}-${i}`) as Element;
					elem.setAttribute("style", i == selectElem.selectedIndex ? "" : "display:none");
				}
			}
		}
		
	}
		
	
	
	namespace stepHider {
		
		let hidden: Array<[int,HTMLElement]> = [];
		let unhideP = getElem("unhide-steps");
		
		// Initialization
		let sectionHeaders = document.querySelectorAll("article div.section h3");
		for (let header of sectionHeaders) {
			header.appendChild(document.createTextNode(" "));
			let stepStr: string = (/^\d+(?=\. )/.exec(header.textContent as string) as RegExpExecArray)[0];
			let button = document.createElement("input");
			button.type = "button";
			button.value = "Hide";
			button.onclick = () => {
				(header.parentNode as HTMLElement).style.display = "none";
				hidden.push([parseInt(stepStr, 10), header as HTMLElement]);
				hidden.sort((x, y) => x[0] - y[0]);
				redraw();
			}
			header.appendChild(button);
		}
		
		
		function redraw(): void {
			while (unhideP.children.length > 0)
				unhideP.removeChild(unhideP.children[0]);
			if (hidden.length == 0) {
				unhideP.style.display = "none";
				return;
			}
			unhideP.style.removeProperty("display");
			for (let [stepNum, header] of hidden) {
				unhideP.appendChild(document.createTextNode(" "));
				let button = document.createElement("input");
				button.type = "button";
				button.value = stepNum.toString();
				button.onclick = () => {
					(header.parentNode as HTMLElement).style.removeProperty("display");
					hidden = hidden.filter(x => x[0] != stepNum);
					redraw();
				};
				unhideP.appendChild(button);
			}
		}
		
	}
	
	
	function cloneElemPerMask(id: string): void {
		let elem = document.getElementById(id);
		if (!(elem instanceof Element))
			throw "Assertion error";
		let parent = elem.parentNode;
		if (!(parent instanceof HTMLElement))
			throw "Assertion error";
		for (let i = 0; i < 8; i++) {
			let node = elem.cloneNode(true) as Element;
			node.setAttribute("class", `${node.getAttribute("class")} ${node.getAttribute("id")}`);
			node.setAttribute("id", `${node.getAttribute("id")}-${i}`);
			parent.insertBefore(node, elem);
		}
		parent.removeChild(elem);
	}
	
	
	export function doGenerate(ev?: Event) {
		if (ev !== undefined)
			ev.preventDefault();
		
		function toCodePoints(s: string): Array<int> {
			let result: Array<int> = [];
			for (let i = 0; i < s.length; i++) {
				const c: int = s.charCodeAt(i);
				if (0xD800 <= c && c < 0xDC00) {
					if (i + 1 >= s.length)
						throw "Invalid UTF-16 string";
					i++;
					const d: int = s.charCodeAt(i);
					result.push(((c & 0x3FF) << 10 | (d & 0x3FF)) + 0x10000);
				} else if (0xDC00 <= c && c < 0xE000)
					throw "Invalid UTF-16 string";
				else
					result.push(c);
			}
			return result;
		}
		
		const textStr: string = (getElem("input-text") as HTMLTextAreaElement).value;
		const text: Array<int> = toCodePoints(textStr);
		const mode: QrSegment.Mode = doStep0(text);
		const segs: Array<QrSegment> = [doStep1(text, mode)];
		
		let errCorrLvl: QrCode.Ecc;
		if      (getInput("errcorlvl-low"     ).checked)  errCorrLvl = QrCode.Ecc.LOW     ;
		else if (getInput("errcorlvl-medium"  ).checked)  errCorrLvl = QrCode.Ecc.MEDIUM  ;
		else if (getInput("errcorlvl-quartile").checked)  errCorrLvl = QrCode.Ecc.QUARTILE;
		else if (getInput("errcorlvl-high"    ).checked)  errCorrLvl = QrCode.Ecc.HIGH    ;
		else  throw "Assertion error";
		const minVer: int = parseInt(getInput("force-min-version").value, 10);
		const version: int = doStep2(segs, errCorrLvl, minVer);
		if (version == -1)
			return;
		
		const dataCodewords: Array<byte> = doStep3(segs, version, errCorrLvl);
		const allCodewords: Array<byte> = doStep4(dataCodewords, version, errCorrLvl);
		const qr = new QrCode(version, errCorrLvl);
		doStep5(qr);
		doStep6(qr, allCodewords);
		let masks: Array<QrCode> = doStep7(qr);
		let penalties: Array<PenaltyInfo> = masks.map((mask, i) => {
			qr.applyMask(mask);
			qr.drawFormatBits(i);
			let result = qr.computePenalties();
			qr.applyMask(mask);
			return result;
		});
		doStep8(qr, masks, penalties);
		let chosenMask: int = doStep9(penalties);
		let forceMask: int = parseInt(getInput("force-mask-pattern").value, 10);
		if (forceMask != -1)
			chosenMask = forceMask;
		qr.applyMask(masks[chosenMask]);
		qr.drawFormatBits(chosenMask);
		qr.clearNewFlags();
		drawQrToSvg(qr, document.getElementById("output-qr-code") as Element);
		maskShower.selectElem.selectedIndex = chosenMask;
		maskShower.showMask();
	}
	
	
	function doStep0(text: Array<int>): QrSegment.Mode {
		getElem("num-code-points").textContent = text.length.toString();
		
		function isNumeric(cp: int): boolean {
			return cp < 128 && "0123456789".indexOf(String.fromCharCode(cp)) != -1;
		}
		function isAlphanumeric(cp: int): boolean {
			return cp < 128 && ALPHANUMERIC_CHARSET.indexOf(String.fromCharCode(cp)) != -1;
		}
		function isKanji(cp: int): boolean {
			return cp < 0x10000 && ((parseInt(KANJI_BIT_SET.charAt(cp >>> 2), 16) >>> (cp & 3)) & 1) != 0;
		}
		
		let allNumeric  = true;
		let allAlphanum = true;
		let allKanji    = true;
		let tbody = clearChildren("#character-analysis tbody");
		text.forEach((cp, i) => {
			let tr = document.createElement("tr");
			let cells: Array<string|boolean> = [
				i.toString(),
				codePointToString(cp),
				"U+" + cp.toString(16).toUpperCase(),
				isNumeric(cp),
				isAlphanumeric(cp),
				true,
				isKanji(cp),
			];
			allNumeric  = allNumeric  && (cells[3] as boolean);
			allAlphanum = allAlphanum && (cells[4] as boolean);
			allKanji    = allKanji    && (cells[6] as boolean);
			for (let cell of cells) {
				let td = document.createElement("td");
				if (typeof cell == "boolean") {
					td.classList.add(cell ? "true" : "false");
					cell = cell ? "Yes" : "No";
				}
				td.textContent = cell;
				tr.appendChild(td);
			}
			tbody.appendChild(tr);
		});
		
		tbody = clearChildren("#character-mode-summary tbody");
		let data: Array<[string,boolean]> = [
			["Numeric"     , allNumeric ],
			["Alphanumeric", allAlphanum],
			["Byte"        , true       ],
			["Kanji"       , allKanji   ],
		];
		for (let row of data) {
			let tr = document.createElement("tr");
			let td = document.createElement("td");
			td.textContent = row[0];
			tr.appendChild(td);
			td = document.createElement("td");
			td.textContent = row[1] ? "Yes" : "No";
			td.classList.add(row[1] ? "true" : "false");
			tr.appendChild(td);
			tbody.appendChild(tr);
		}
		
		let modeStr: string;
		let result: QrSegment.Mode;
		if (text.length == 0)
			result = QrSegment.Mode.BYTE;
		else if (allNumeric)
			result = QrSegment.Mode.NUMERIC;
		else if (allAlphanum)
			result = QrSegment.Mode.ALPHANUMERIC;
		else
			result = QrSegment.Mode.BYTE;
		getElem("chosen-segment-mode").textContent = result.name;
		// Kanji mode encoding is not supported due to big conversion table
		return result;
	}
	
	
	function doStep1(text: Array<int>, mode: QrSegment.Mode): QrSegment {
		getElem("data-segment-chars").className = mode.name.toLowerCase();
		
		let bitData: Array<bit> = [];
		let numChars = text.length;
		let tbody = clearChildren("#data-segment-chars tbody");
		text.forEach((cp, i) => {
			let hexValues: string = "";
			let decValue: string = "";
			let rowSpan: int = 0;
			let combined: string = "";
			let bits: string = "";
			if (mode == QrSegment.Mode.NUMERIC) {
				if (i % 3 == 0) {
					rowSpan = Math.min(3, text.length - i);
					let s: string = text.slice(i, i + rowSpan).map(c => String.fromCharCode(c)).join("");
					let temp: int = parseInt(s, 10);
					combined = temp.toString(10).padStart(rowSpan, "0");
					bits = temp.toString(2).padStart(rowSpan * 3 + 1, "0");
				}
			} else if (mode == QrSegment.Mode.ALPHANUMERIC) {
				let temp: int = ALPHANUMERIC_CHARSET.indexOf(String.fromCharCode(cp));
				decValue = temp.toString(10);
				if (i % 2 == 0) {
					rowSpan = Math.min(2, text.length - i);
					if (rowSpan == 2) {
						temp *= ALPHANUMERIC_CHARSET.length;
						temp += ALPHANUMERIC_CHARSET.indexOf(String.fromCharCode(text[i + 1]));
					}
					combined = temp.toString(10);
					bits = temp.toString(2).padStart(rowSpan * 5 + 1, "0");
				}
			} else if (mode == QrSegment.Mode.BYTE) {
				rowSpan = 1;
				let temp: Array<byte> = codePointToUtf8(cp);
				hexValues = temp.map(c => c.toString(16).toUpperCase().padStart(2, "0")).join(" ");
				bits      = temp.map(c => c.toString( 2).toUpperCase().padStart(8, "0")).join("" );
				numChars += temp.length - 1;
			} else
				throw "Assertion error";
			for (let c of bits)
				bitData.push(parseInt(c, 2));
			
			let cells: Array<string> = [
				i.toString(),
				codePointToString(cp),
				hexValues,
				decValue,
			];
			if (rowSpan > 0)
				cells.push(combined, bits);
			let tr = document.createElement("tr");
			cells.forEach((cell, j) => {
				let td = document.createElement("td");
				td.textContent = cell;
				if (j >= 4)
					td.rowSpan = rowSpan;
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
		
		getElem("segment-mode" ).textContent = mode.name.toString();
		getElem("segment-count").textContent = numChars + " " + (mode == QrSegment.Mode.BYTE ? "bytes" : "characters");
		getElem("segment-data" ).textContent = bitData.length + " bits long";
		return new QrSegment(mode, numChars, bitData);
	}
	
	
	function doStep2(segs: Array<QrSegment>, ecl: QrCode.Ecc, minVer: int): int {
		let trs = document.querySelectorAll("#segment-size tbody tr");
		[1, 10, 27].forEach((ver, i) => {
			let numBits = QrSegment.getTotalBits(segs, ver);
			let numCodewords = Math.ceil(numBits / 8);
			let tds = trs[i].querySelectorAll("td");
			tds[1].textContent = numBits < Infinity ? numBits.toString() : "Not encodable";
			tds[2].textContent = numCodewords < Infinity ? numCodewords.toString() : "Not encodable";
		});
		
		const ERRCORRLVLS = [QrCode.Ecc.LOW, QrCode.Ecc.MEDIUM, QrCode.Ecc.QUARTILE, QrCode.Ecc.HIGH];
		let tbody = clearChildren("#codewords-per-version tbody");
		let result: int = -1;
		for (let ver = 1; ver <= 40; ver++) {
			let tr = document.createElement("tr");
			let td = document.createElement("td");
			td.textContent = ver.toString();
			tr.appendChild(td);
			let numCodewords = Math.ceil(QrSegment.getTotalBits(segs, ver) / 8);
			ERRCORRLVLS.forEach((e, i) => {
				let td = document.createElement("td");
				let capacityCodewords: int = QrCode.getNumDataCodewords(ver, e);
				td.textContent = capacityCodewords.toString();
				if (e == ecl) {
					if (numCodewords <= capacityCodewords) {
						td.classList.add("true");
						if (result == -1 && ver >= minVer)
							result = ver;
					} else
						td.classList.add("false");
				}
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		}
		getElem("chosen-version").textContent = result != -1 ? result.toString() : "Cannot fit any version";
		return result;
	}
	
	
	function doStep3(segs: Array<QrSegment>, ver: int, ecl: QrCode.Ecc): Array<byte> {
		let allBits: Array<bit> = [];
		let tbody = clearChildren("#segment-and-padding-bits tbody");
		function addRow(name: string, bits: Array<bit>): void {
			bits.forEach(b => allBits.push(b));
			let tr = document.createElement("tr");
			let cells: Array<string> = [
				name,
				bits.join(""),
				bits.length.toString(),
				allBits.length.toString(),
			];
			cells.forEach(s => {
				let td = document.createElement("td");
				td.textContent = s;
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		}
		
		segs.forEach((seg, i) => {
			addRow(`Segment ${i} mode`, intToBits(seg.mode.modeBits, 4));
			addRow(`Segment ${i} count`, intToBits(seg.numChars, seg.mode.numCharCountBits(ver)));
			addRow(`Segment ${i} data`, seg.bitData);
		});
		
		let capacityBits: int = QrCode.getNumDataCodewords(ver, ecl) * 8;
		addRow("Terminator", [0,0,0,0].slice(0, Math.min(4, capacityBits - allBits.length)));
		addRow("Bit padding", [0,0,0,0,0,0,0].slice(0, (8 - allBits.length % 8) % 8));
		let bytePad: Array<bit> = [];
		for (let i = 0, n = (capacityBits - allBits.length) / 8; i < n; i++) {
			if (i % 2 == 0)
				bytePad.push(1,1,1,0,1,1,0,0);
			else
				bytePad.push(0,0,0,1,0,0,0,1);
		}
		addRow("Byte padding", bytePad);
		
		queryElem("#full-bitstream span").textContent = allBits.join("");
		let result: Array<byte> = [];
		for (let i = 0; i < allBits.length; i += 8) {
			let b = 0;
			for (let j = 0; j < 8; j++)
				b = (b << 1) | allBits[i + j];
			result.push(b);
		}
		getElem("all-data-codewords").textContent = result.map(
			b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
		return result;
	}
	
	
	function doStep4(data: Array<byte>, ver: int, ecl: QrCode.Ecc): Array<byte> {
		let numBlocks: int = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
		let blockEccLen: int = QrCode.ECC_CODEWORDS_PER_BLOCK  [ecl.ordinal][ver];
		let rawCodewords: int = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
		let numShortBlocks: int = numBlocks - rawCodewords % numBlocks;
		let shortBlockLen: int = Math.floor(rawCodewords / numBlocks);
		let tds = document.querySelectorAll("#block-stats td:nth-child(2)");
		tds[0].textContent = data.length.toString();
		tds[1].textContent = numBlocks.toString();
		tds[2].textContent = (shortBlockLen - blockEccLen).toString();
		tds[3].textContent = numShortBlocks < numBlocks ? (shortBlockLen - blockEccLen + 1).toString() : "N/A";
		tds[4].textContent = blockEccLen.toString();
		tds[5].textContent = numShortBlocks.toString();
		tds[6].textContent = (numBlocks - numShortBlocks).toString();
		
		let blocks: Array<Array<byte>> = [];
		let rs = new ReedSolomonGenerator(blockEccLen);
		for (let i = 0, k = 0; i < numBlocks; i++) {
			let dat: Array<byte> = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
			k += dat.length;
			let ecc: Array<byte> = rs.getRemainder(dat);
			if (i < numShortBlocks)
				dat.push(0);
			blocks.push(dat.concat(ecc));
		}
		
		{
			let thead = document.querySelector("#blocks-and-ecc thead") as HTMLElement;
			if (thead.children.length >= 2)
				thead.removeChild(thead.children[1]);
			(thead.querySelectorAll("th")[1] as HTMLTableHeaderCellElement).colSpan = numBlocks;
			let tr = document.createElement("tr");
			blocks.forEach((_, i) => {
				let th = document.createElement("th");
				th.textContent = i.toString();
				tr.appendChild(th);
			});
			thead.appendChild(tr);
		} {
			let tbody = clearChildren("#blocks-and-ecc tbody");
			let verticalTh = document.createElement("th");
			verticalTh.textContent = "Codeword index";
			verticalTh.rowSpan = shortBlockLen;  // Not final value; work around Firefox bug
			for (let i = 0; i < shortBlockLen + 1; i++) {
				let tr = document.createElement("tr");
				tr.className = i < shortBlockLen + 1 - blockEccLen ? "data" : "ecc";
				if (i == 0)
					tr.appendChild(verticalTh);
				let th = document.createElement("th");
				th.textContent = i.toString();
				tr.appendChild(th);
				blocks.forEach((block, j) => {
					let td = document.createElement("td");
					if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
						td.textContent = block[i].toString(16).toUpperCase().padStart(2, "0");
					tr.appendChild(td);
				});
				tbody.appendChild(tr);
			}
			tbody.clientHeight;  // Read property to force reflow in Firefox
			verticalTh.rowSpan = shortBlockLen + 1;
		}
		
		let result: Array<byte> = [];
		for (let i = 0; i < blocks[0].length; i++) {
			for (let j = 0; j < blocks.length; j++) {
				if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
					result.push(blocks[j][i]);
			}
		}
		
		let output = clearChildren("#interleaved-codewords");
		let span = document.createElement("span");
		span.textContent = result.slice(0, data.length).map(
			b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
		span.className = "data";
		output.appendChild(span);
		output.appendChild(document.createTextNode(" "));
		span = document.createElement("span");
		span.textContent = result.slice(data.length).map(
			b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
		span.className = "ecc";
		output.appendChild(span);
		return result;
	}
	
	
	function doStep5(qr: QrCode): void {
		qr.drawTimingPatterns();
		drawQrToSvg(qr, document.getElementById("timing-patterns") as Element);
		qr.clearNewFlags();
		
		qr.drawFinderPatterns();
		drawQrToSvg(qr, document.getElementById("finder-patterns") as Element);
		qr.clearNewFlags();
		
		qr.drawAlignmentPatterns();
		drawQrToSvg(qr, document.getElementById("alignment-patterns") as Element);
		qr.clearNewFlags();
		let alignPatContainer = getElem("alignment-patterns-container");
		if (qr.version == 1) alignPatContainer.style.display = "none";
		else alignPatContainer.style.removeProperty("display");
		
		qr.drawFormatBits(-1);
		drawQrToSvg(qr, document.getElementById("dummy-format-bits") as Element);
		qr.clearNewFlags();
		
		qr.drawVersionInformation();
		drawQrToSvg(qr, document.getElementById("version-information") as Element);
		qr.clearNewFlags();
		let verInfoContainer = getElem("version-information-container");
		if (qr.version < 7) verInfoContainer.style.display = "none";
		else verInfoContainer.style.removeProperty("display");
	}
	
	
	function doStep6(qr: QrCode, allCodewords: Array<byte>): void {
		const zigZagScan: Array<[int,int]> = qr.makeZigZagScan();
		let zigZagSvg = document.getElementById("zig-zag-scan") as Element;
		drawQrToSvg(qr, zigZagSvg);
		{
			let s = "";
			for (let [x, y] of zigZagScan)
				s += (s == "" ? "M" : "L") + (x + 0.5) + "," + (y + 0.5);
			let path = document.createElementNS(zigZagSvg.namespaceURI, "path");
			path.setAttribute("class", "zigzag-line");
			path.setAttribute("d", s);
			zigZagSvg.appendChild(path);
		} {
			let s = "";
			for (let [x, y] of zigZagScan)
				s += `M${x+0.5},${y+0.5}h0`;
			let path = document.createElementNS(zigZagSvg.namespaceURI, "path");
			path.setAttribute("class", "zigzag-dots");
			path.setAttribute("d", s);
			zigZagSvg.appendChild(path);
		}
		
		qr.drawCodewords(allCodewords, zigZagScan);
		qr.clearNewFlags();
		drawQrToSvg(qr, document.getElementById("codewords-and-remainder") as Element);
	}
	
	
	function doStep7(qr: QrCode): Array<QrCode> {
		let result: Array<QrCode> = [];
		for (let i = 0; i < 8; i++) {
			const mask = qr.makeMask(i);
			mask.clearNewFlags();
			result.push(mask);
			drawQrToSvg(mask, document.getElementById("mask-pattern-" + i) as Element);
			
			qr.applyMask(mask);
			qr.drawFormatBits(-1);
			qr.clearNewFlags();
			drawQrToSvg(qr, document.getElementById("masked-qr-code-" + i) as Element);
			
			qr.drawFormatBits(i);
			drawQrToSvg(qr, document.getElementById("masked-qr-with-format-" + i) as Element);
			qr.applyMask(mask);
			qr.clearNewFlags();
		}
		return result;
	}
	
	
	function doStep8(qr: QrCode, masks: Array<QrCode>, penalties: Array<PenaltyInfo>): void {
		function getAndDrawSvg(name: string, i: int): [Element,Element] {
			let svg = document.getElementById(`${name}-${i}`) as Element;
			drawQrToSvg(qr, svg);
			let group = document.createElementNS(svg.namespaceURI, "g");
			svg.appendChild(group);
			return [svg, group];
		}
		
		function appendRect(container: Element, x: int, y: int, width: int, height: int): void {
			let rect = document.createElementNS(container.namespaceURI, "rect");
			rect.setAttribute("x", x.toString());
			rect.setAttribute("y", y.toString());
			rect.setAttribute("width", width.toString());
			rect.setAttribute("height", height.toString());
			rect.setAttribute("rx", "0.5");
			rect.setAttribute("ry", "0.5");
			container.appendChild(rect);
		}
		
		for (let i = 0; i < masks.length; i++) {
			qr.applyMask(masks[i]);
			qr.drawFormatBits(i);
			qr.clearNewFlags();
			const penaltyInfo = penalties[i];
			{
				let [svg, group] = getAndDrawSvg("horizontal-runs", i);
				penaltyInfo.horizontalRuns.forEach(
					run => appendRect(group, run.startX, run.startY, run.runLength, 1));
			} {
				let [svg, group] = getAndDrawSvg("vertical-runs", i);
				penaltyInfo.verticalRuns.forEach(
					run => appendRect(group, run.startX, run.startY, 1, run.runLength));
			} {
				let [svg, group] = getAndDrawSvg("two-by-two-boxes", i);
				penaltyInfo.twoByTwoBoxes.forEach(
					([x, y]) => appendRect(group, x, y, 2, 2));
			} {
				let [svg, group] = getAndDrawSvg("horizontal-false-finders", i);
				penaltyInfo.horizontalFalseFinders.forEach(
					run => appendRect(group, run.startX, run.startY, run.runLength, 1));
			} {
				let [svg, group] = getAndDrawSvg("vertical-false-finders", i);
				penaltyInfo.verticalFalseFinders.forEach(
					run => appendRect(group, run.startX, run.startY, 1, run.runLength));
			} {
				let tds = document.querySelectorAll(`#black-white-balance-${i} td:nth-child(2)`);
				let total = qr.size * qr.size;
				let black = penaltyInfo.numBlackModules;
				let percentBlack = black * 100 / total;
				tds[0].textContent = qr.size.toString();
				tds[1].textContent = total.toString();
				tds[2].textContent = (total - black).toString();
				tds[3].textContent = black.toString();
				tds[4].textContent = percentBlack.toFixed(3) + "%";
				tds[5].textContent = (percentBlack - 50).toFixed(3).replace(/-/, "\u2212") + "%";
			}
			qr.applyMask(masks[i]);
		}
	}
	
	
	function doStep9(penalties: Array<PenaltyInfo>): int {
		let tbody = clearChildren("#select-best-mask");
		let result = -1;
		let minPenalty = Infinity;
		penalties.forEach((penaltyInfo, maskNum) => {
			let totalPoints = sum(penaltyInfo.penaltyPoints);
			if (totalPoints < minPenalty) {
				minPenalty = totalPoints;
				result = maskNum;
			}
			let tr = document.createElement("tr");
			let cells: Array<int> = [maskNum].concat(penaltyInfo.penaltyPoints).concat([totalPoints]);
			cells.forEach((val, i) => {
				let elem = document.createElement(i == 0 ? "th" : "td");
				elem.textContent = val.toString();
				tr.appendChild(elem);
			});
			tbody.appendChild(tr);
		});
		getElem("lowest-penalty-mask").textContent = result.toString();
		tbody.children[result].classList.add("true");
		return result;
	}
	
	
	function drawQrToSvg(qr: QrCode, svg: Element): void {
		const EXTRA_BORDER: number = 0.2;
		const a = -EXTRA_BORDER, b = qr.size + EXTRA_BORDER * 2;
		svg.setAttribute("viewBox", `${a} ${a} ${b} ${b}`);
		
		while (svg.firstChild !== null)
			svg.removeChild(svg.firstChild);
		let hasUnfilled: boolean = qr.modules.some(
			col => col.some(cell => cell instanceof UnfilledModule));
		if (hasUnfilled) {
			let rect = document.createElementNS(svg.namespaceURI, "rect");
			rect.setAttribute("class", "gray");
			rect.setAttribute("x", "0");
			rect.setAttribute("y", "0");
			rect.setAttribute("width", qr.size.toString());
			rect.setAttribute("height", qr.size.toString());
			svg.appendChild(rect);
		}
		let whites = "";
		let blacks = "";
		qr.modules.forEach((column, x) => {
			column.forEach((cell, y) => {
				if (cell instanceof FilledModule) {
					const s = `M${x},${y}h1v1h-1z`;
					if (cell.color) blacks += s;
					else            whites += s;
				}
			});
		});
		let whitePath = document.createElementNS(svg.namespaceURI, "path");
		whitePath.setAttribute("class", "white");
		whitePath.setAttribute("d", whites);
		svg.appendChild(whitePath);
		let blackPath = document.createElementNS(svg.namespaceURI, "path");
		blackPath.setAttribute("class", "black");
		blackPath.setAttribute("d", blacks);
		svg.appendChild(blackPath);
		
		let news = "";
		for (let x = 0; x <= qr.size; x++) {
			for (let y = 0; y <= qr.size; y++) {
				if (y < qr.size) {
					let a: Module = x > 0 ? qr.modules[x - 1][y]   : new UnfilledModule();
					let b: Module = x < qr.size ? qr.modules[x][y] : new UnfilledModule();
					let c: boolean = a instanceof FilledModule ? a.isNew : false;
					let d: boolean = b instanceof FilledModule ? b.isNew : false;
					if (c != d)
						news += `M${x},${y}v1`;
				}
				if (x < qr.size) {
					let a: Module = y > 0 ? qr.modules[x][y - 1]   : new UnfilledModule();
					let b: Module = y < qr.size ? qr.modules[x][y] : new UnfilledModule();
					let c: boolean = a instanceof FilledModule ? a.isNew : false;
					let d: boolean = b instanceof FilledModule ? b.isNew : false;
					if (c != d)
						news += `M${x},${y}h1`;
				}
			}
		}
		let newPath = document.createElementNS(svg.namespaceURI, "path");
		newPath.setAttribute("class", "new");
		newPath.setAttribute("d", news);
		svg.appendChild(newPath);
	}
	
	
	
	class QrCode {
		
		public readonly size: int;
		public modules: Array<Array<Module>> = [];
		
		
		public constructor(
				public readonly version: int,
				public readonly errorCorrectionLevel: QrCode.Ecc) {
			this.size = version * 4 + 17;
			let column: Array<Module> = [];
			for (let i = 0; i < this.size; i++)
				column.push(new UnfilledModule());
			for (let i = 0; i < this.size; i++)
				this.modules.push(column.slice());
		}
		
		
		public static getNumRawDataModules(ver: int): int {
			if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION)
				throw "Version number out of range";
			let result: int = (16 * ver + 128) * ver + 64;
			if (ver >= 2) {
				let numAlign: int = Math.floor(ver / 7) + 2;
				result -= (25 * numAlign - 10) * numAlign - 55;
				if (ver >= 7)
					result -= 36;
			}
			return result;
		}
		
		
		public static getNumDataCodewords(ver: int, ecl: QrCode.Ecc): int {
			return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
				QrCode.ECC_CODEWORDS_PER_BLOCK    [ecl.ordinal][ver] *
				QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
		}
		
		
		public clearNewFlags(): void {
			for (let x = 0; x < this.size; x++) {
				for (let y = 0; y < this.size; y++) {
					let m = this.modules[x][y];
					if (m instanceof FilledModule)
						m.isNew = false;
				}
			}
		}
		
		
		public drawTimingPatterns(): void {
			for (let i = 0; i < this.size; i++) {
				this.modules[6][i] = new FunctionModule(i % 2 == 0);
				this.modules[i][6] = new FunctionModule(i % 2 == 0);
			}
		}
		
		
		public drawFinderPatterns(): void {
			const centers: Array<[int,int]> = [
				[3, 3],
				[this.size - 4, 3],
				[3, this.size - 4],
			];
			for (const [cx, cy] of centers) {
				for (let dy = -4; dy <= 4; dy++) {
					for (let dx = -4; dx <= 4; dx++) {
						let dist: int = Math.max(Math.abs(dx), Math.abs(dy));
						let x: int = cx + dx;
						let y: int = cy + dy;
						if (0 <= x && x < this.size && 0 <= y && y < this.size)
							this.modules[x][y] = new FunctionModule(dist != 2 && dist != 4);
					}
				}
			}
		}
		
		
		public drawAlignmentPatterns(): void {
			let alignPatPos: Array<int> = [];
			if (this.version >= 2) {
				let numAlign: int = Math.floor(this.version / 7) + 2;
				let step: int = (this.version == 32) ? 26 :
					Math.ceil((this.size - 13) / (numAlign*2 - 2)) * 2;
				alignPatPos = [6];
				for (let pos = this.size - 7; alignPatPos.length < numAlign; pos -= step)
					alignPatPos.splice(1, 0, pos);
			}
			
			alignPatPos.forEach((cx, i) => {
				alignPatPos.forEach((cy, j) => {
					if (i == 0 && j == 0 || i == 0 && j == alignPatPos.length - 1 || i == alignPatPos.length - 1 && j == 0)
						return;
					for (let dy = -2; dy <= 2; dy++) {
						for (let dx = -2; dx <= 2; dx++)
							this.modules[cx + dx][cy + dy] = new FunctionModule(Math.max(Math.abs(dx), Math.abs(dy)) != 1);
					}
				});
			});
		}
		
		
		public drawFormatBits(mask: int): void {
			let bits: int = 0;
			if (mask != -1) {
				const data: int = this.errorCorrectionLevel.formatBits << 3 | mask;
				let rem: int = data;
				for (let i = 0; i < 10; i++)
					rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
				bits = (data << 10 | rem) ^ 0x5412;  // uint15
			}
			if (bits >>> 15 != 0)
				throw "Assertion error";
			
			for (let i = 0; i <= 5; i++)
				this.modules[8][i] = new FunctionModule(getBit(bits, i));
			this.modules[8][7] = new FunctionModule(getBit(bits, 6));
			this.modules[8][8] = new FunctionModule(getBit(bits, 7));
			this.modules[7][8] = new FunctionModule(getBit(bits, 8));
			for (let i = 9; i < 15; i++)
				this.modules[14 - i][8] = new FunctionModule(getBit(bits, i));
			
			for (let i = 0; i < 8; i++)
				this.modules[this.size - 1 - i][8] = new FunctionModule(getBit(bits, i));
			for (let i = 8; i < 15; i++)
				this.modules[8][this.size - 15 + i] = new FunctionModule(getBit(bits, i));
			this.modules[8][this.size - 8] = new FunctionModule(true);
		}
		
		
		public drawVersionInformation(): void {
			if (this.version < 7)
				return;
			
			let rem: int = this.version;
			for (let i = 0; i < 12; i++)
				rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
			const bits: int = this.version << 12 | rem;
			if (bits >>> 18 != 0)
				throw "Assertion error";
			
			for (let i = 0; i < 18; i++) {
				let bt: boolean = getBit(bits, i);
				let a: int = this.size - 11 + i % 3;
				let b: int = Math.floor(i / 3);
				this.modules[a][b] = new FunctionModule(bt);
				this.modules[b][a] = new FunctionModule(bt);
			}
		}
		
		
		public makeZigZagScan(): Array<[int,int]> {
			let result: Array<[int,int]> = [];
			for (let right = this.size - 1; right >= 1; right -= 2) {
				if (right == 6)
					right = 5;
				for (let vert = 0; vert < this.size; vert++) {
					for (let j = 0; j < 2; j++) {
						let x: int = right - j;
						let upward: boolean = ((right + 1) & 2) == 0;
						let y: int = upward ? this.size - 1 - vert : vert;
						if (this.modules[x][y] instanceof UnfilledModule)
							result.push([x, y]);
					}
				}
			}
			return result;
		}
		
		
		public drawCodewords(data: Array<byte>, zigZagScan: Array<[int,int]>): void {
			if (data.length != Math.floor(QrCode.getNumRawDataModules(this.version) / 8))
				throw "Invalid argument";
			zigZagScan.forEach((xy, i) => {
				let [x, y] = xy;
				if (i < data.length * 8) {
					this.modules[x][y] = new CodewordModule(getBit(data[i >>> 3], 7 - (i & 7)));
					i++;
				} else
					this.modules[x][y] = new RemainderModule();
			});
		}
		
		
		public makeMask(mask: int): QrCode {
			let result = new QrCode(this.version, this.errorCorrectionLevel);
			for (let x = 0; x < this.size; x++) {
				for (let y = 0; y < this.size; y++) {
					let invert: boolean;
					switch (mask) {
						case 0:  invert = (x + y) % 2 == 0;                                  break;
						case 1:  invert = y % 2 == 0;                                        break;
						case 2:  invert = x % 3 == 0;                                        break;
						case 3:  invert = (x + y) % 3 == 0;                                  break;
						case 4:  invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;  break;
						case 5:  invert = x * y % 2 + x * y % 3 == 0;                        break;
						case 6:  invert = (x * y % 2 + x * y % 3) % 2 == 0;                  break;
						case 7:  invert = ((x + y) % 2 + x * y % 3) % 2 == 0;                break;
						default:  throw "Assertion error";
					}
					if (!(this.modules[x][y] instanceof FunctionModule))
						result.modules[x][y] = new FilledModule(invert);
				}
			}
			return result;
		}
		
		
		public applyMask(mask: QrCode): void {
			for (let x = 0; x < this.size; x++) {
				for (let y = 0; y < this.size; y++) {
					let a = mask.modules[x][y];
					if (a instanceof FilledModule) {
						let b = this.modules[x][y] as FilledModule;
						b.color = b.color != a.color;
					}
				}
			}
		}
		
		
		public computePenalties(): PenaltyInfo {
			function addRunToHistory(run: int, history: Array<int>): void {
				history.pop();
				history.unshift(run);
			}
			
			function hasFinderLikePattern(runHistory: Array<int>): boolean {
				const n: int = runHistory[1];
				return n > 0 && runHistory[2] == n && runHistory[4] == n && runHistory[5] == n
					&& runHistory[3] == n * 3 && Math.max(runHistory[0], runHistory[6]) >= n * 4;
			}
			
			let penalties: [int,int,int,int] = [0, 0, 0, 0];
			const colors: Array<Array<boolean>> = this.modules.map(
				column => column.map(cell => cell instanceof FilledModule && cell.color));
			
			let horzRuns   : Array<LinearRun> = [];
			let horzFinders: Array<LinearRun> = [];
			for (let y = 0; y < this.size; y++) {
				let runHistory = [0,0,0,0,0,0,0];
				let color = false;
				let runLen = 0;
				for (let x = 0; ; x++) {
					if (x < this.size && colors[x][y] == color)
						runLen++;
					else {
						if (runLen >= 5) {
							penalties[0] += QrCode.PENALTY_N1 + runLen - 5;
							horzRuns.push(new LinearRun(x - runLen, y, runLen));
						}
						addRunToHistory(runLen, runHistory);
						if (x >= this.size && color) {
							addRunToHistory(0, runHistory);
							color = false;
						}
						if (!color && hasFinderLikePattern(runHistory)) {
							penalties[2] += QrCode.PENALTY_N3;
							let n = sum(runHistory);
							horzFinders.push(new LinearRun(x - n, y, n));
						}
						if (x >= this.size)
							break;
						color = colors[x][y];
						runLen = 1;
					}
				}
			}
			
			let vertRuns   : Array<LinearRun> = [];
			let vertFinders: Array<LinearRun> = [];
			for (let x = 0; x < this.size; x++) {
				let runHistory = [0,0,0,0,0,0,0];
				let color = false;
				let runLen = 0;
				for (let y = 0; ; y++) {
					if (y < this.size && colors[x][y] == color)
						runLen++;
					else {
						if (runLen >= 5) {
							penalties[0] += QrCode.PENALTY_N1 + runLen - 5;
							vertRuns.push(new LinearRun(x, y - runLen, runLen));
						}
						addRunToHistory(runLen, runHistory);
						if (y >= this.size && color) {
							addRunToHistory(0, runHistory);
							color = false;
						}
						if (!color && hasFinderLikePattern(runHistory)) {
							penalties[2] += QrCode.PENALTY_N3;
							let n = sum(runHistory);
							vertFinders.push(new LinearRun(x, y - n, n));
						}
						if (y >= this.size)
							break;
						color = colors[x][y];
						runLen = 1;
					}
				}
			}
			
			let twoByTwos: Array<[int,int]> = [];
			for (let x = 0; x < this.size - 1; x++) {
				for (let y = 0; y < this.size - 1; y++) {
					let c: boolean = colors[x][y];
					if (c == colors[x + 1][y] && c == colors[x][y + 1] && c == colors[x + 1][y + 1]) {
						penalties[1] += QrCode.PENALTY_N2;
						twoByTwos.push([x, y]);
					}
				}
			}
			
			let black: int = 0;
			for (let column of colors) {
				for (let color of column) {
					if (color)
						black++;
				}
			}
			let total: int = this.size * this.size;
			let k = 0;
			while (Math.abs(black * 20 - total * 10) > (k + 1) * total)
				k++;
			penalties[3] += k * QrCode.PENALTY_N4;
			
			return new PenaltyInfo(horzRuns, vertRuns, twoByTwos,
				horzFinders, vertFinders, black, penalties);
		}
		
		
		public static readonly MIN_VERSION: int =  1;
		public static readonly MAX_VERSION: int = 40;
		
		public static readonly PENALTY_N1: int =  3;
		public static readonly PENALTY_N2: int =  3;
		public static readonly PENALTY_N3: int = 40;
		public static readonly PENALTY_N4: int = 10;
		
		public static readonly ECC_CODEWORDS_PER_BLOCK: Array<Array<int>> = [
			[-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
			[-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
			[-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
			[-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
		];
		
		public static readonly NUM_ERROR_CORRECTION_BLOCKS: Array<Array<int>> = [
			[-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
			[-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
			[-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
			[-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
		];
		
	}
	
	
	
	/*---- Module class and subclasses ----*/
	
	class Module {}
	
	
	class UnfilledModule extends Module {}
	
	
	class FilledModule extends Module {
		public isNew: boolean = true;
		
		public constructor(
				public color: boolean) {
			super();
		}
	}
	
	
	class FunctionModule extends FilledModule {
		public constructor(color: boolean) {
			super(color);
		}
	}
	
	
	class CodewordModule extends FilledModule {
		public constructor(color: boolean) {
			super(color);
		}
	}
	
	
	class RemainderModule extends FilledModule {
		public constructor() {
			super(false);
		}
	}
	
	
	class QrSegment {
		public constructor(
				public readonly mode: QrSegment.Mode,
				public readonly numChars: int,
				public readonly bitData: Array<bit>) {
			if (numChars < 0)
				throw "Invalid argument";
		}
		
		public static getTotalBits(segs: Array<QrSegment>, version: int): number {
			let result: int = 0;
			for (let seg of segs) {
				let ccbits: int = seg.mode.numCharCountBits(version);
				if (seg.numChars >= (1 << ccbits))
					return Infinity;
				result += 4 + ccbits + seg.bitData.length;
			}
			return result;
		}
	}
	
	
	class ReedSolomonGenerator {
		
		private readonly coefficients: Array<byte> = [];
		
		
		public constructor(degree: int) {
			if (degree < 1 || degree > 255)
				throw "Degree out of range";
			let coefs = this.coefficients;
			
			for (let i = 0; i < degree - 1; i++)
				coefs.push(0);
			coefs.push(1);
			
			let root = 1;
			for (let i = 0; i < degree; i++) {
				for (let j = 0; j < coefs.length; j++) {
					coefs[j] = ReedSolomonGenerator.multiply(coefs[j], root);
					if (j + 1 < coefs.length)
						coefs[j] ^= coefs[j + 1];
				}
				root = ReedSolomonGenerator.multiply(root, 0x02);
			}
		}
		
		
		public getRemainder(data: Array<byte>): Array<byte> {
			let result: Array<byte> = this.coefficients.map(_ => 0);
			for (let b of data) {
				let factor: byte = b ^ (result.shift() as int);
				result.push(0);
				for (let i = 0; i < result.length; i++)
					result[i] ^= ReedSolomonGenerator.multiply(this.coefficients[i], factor);
			}
			return result;
		}
		
		
		private static multiply(x: byte, y: byte): byte {
			if (x >>> 8 != 0 || y >>> 8 != 0)
				throw "Byte out of range";
			let z: int = 0;
			for (let i = 7; i >= 0; i--) {
				z = (z << 1) ^ ((z >>> 7) * 0x11D);
				z ^= ((y >>> i) & 1) * x;
			}
			if (z >>> 8 != 0)
				throw "Assertion error";
			return z as byte;
		}
		
	}
	
	
	namespace QrCode {
		export class Ecc {
			public static readonly LOW      = new Ecc(0, 1);
			public static readonly MEDIUM   = new Ecc(1, 0);
			public static readonly QUARTILE = new Ecc(2, 3);
			public static readonly HIGH     = new Ecc(3, 2);
			
			private constructor(
				public readonly ordinal: int,
				public readonly formatBits: int) {}
		}
	}
	
	
	class PenaltyInfo {
		constructor(
			public readonly horizontalRuns: Array<LinearRun>,
			public readonly verticalRuns: Array<LinearRun>,
			public readonly twoByTwoBoxes: Array<[int,int]>,
			public readonly horizontalFalseFinders: Array<LinearRun>,
			public readonly verticalFalseFinders: Array<LinearRun>,
			public readonly numBlackModules: int,
			public readonly penaltyPoints: [int,int,int,int]) {}
	}
	
	
	class LinearRun {
		constructor(
			public readonly startX: int,
			public readonly startY: int,
			public readonly runLength: int) {}
	}
	
	
	namespace QrSegment {
		export class Mode {
			public static readonly NUMERIC      = new Mode(0x1, [10, 12, 14], "Numeric"     );
			public static readonly ALPHANUMERIC = new Mode(0x2, [ 9, 11, 13], "Alphanumeric");
			public static readonly BYTE         = new Mode(0x4, [ 8, 16, 16], "Byte"        );
			public static readonly KANJI        = new Mode(0x8, [ 8, 10, 12], "Kanji"       );
			public static readonly ECI          = new Mode(0x7, [ 0,  0,  0], "ECI"         );
			
			private constructor(
				public readonly modeBits: int,
				private readonly numBitsCharCount: [int,int,int],
				public readonly name: string) {}
			
			public numCharCountBits(ver: int): int {
				return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
			}
		}
	}
	
	
	
	/*---- Simple utilities ----*/
	
	function getElem(id: string): HTMLElement {
		const result: HTMLElement|null = document.getElementById(id);
		if (result instanceof HTMLElement)
			return result;
		throw "Assertion error";
	}
	
	
	function getInput(id: string): HTMLInputElement {
		const result: HTMLElement = getElem(id);
		if (result instanceof HTMLInputElement)
			return result;
		throw "Assertion error";
	}
	
	
	function queryElem(q: string): HTMLElement {
		let result = document.querySelector(q);
		if (result instanceof HTMLElement)
			return result;
		throw "Assertion error";
	}
	
	
	function clearChildren(elemOrQuery: string|HTMLElement): HTMLElement {
		let elem: HTMLElement;
		if (typeof elemOrQuery == "string")
			elem = queryElem(elemOrQuery);
		else
			elem = elemOrQuery;
		while (elem.firstChild != null)
			elem.removeChild(elem.firstChild);
		return elem;
	}
	
	
	function codePointToUtf8(cp: int): Array<byte> {
		if (cp < 0)
			throw "Invalid code point";
		if (cp < 0x80)
			return [cp];
		let n: int;
		if      (cp <    0x800)  n = 2;
		else if (cp <  0x10000)  n = 3;
		else if (cp < 0x110000)  n = 4;
		else  throw "Invalid code point";
		let result = [];
		for (let i = 0; i < n; i++, cp >>>= 6)
			result.push(0x80 | (cp & 0x3F));
		result.reverse();
		result[0] |= (0xF00 >>> n) & 0xFF;
		return result;
	}
	
	
	function codePointToString(cp: int): string {
		if (cp < 0x10000)
			return String.fromCharCode(cp);
		else {
			return String.fromCharCode(
				0xD800 | ((cp - 0x10000) >>> 10),
				0xDC00 | ((cp - 0x10000) & 0x3FF));
		}
	}
	
	
	function intToBits(val: int, len: int): Array<bit> {
		if (len < 0 || len > 31 || val >>> len != 0)
			throw "Value out of range";
		let result: Array<bit> = [];
		for (let i = len - 1; i >= 0; i--)
			result.push((val >>> i) & 1);
		return result;
	}
	
	
	function getBit(x: int, i: int): boolean {
		return ((x >>> i) & 1) != 0;
	}
	
	
	function sum(arr: Array<int>): int {
		let result: int = 0;
		for (const x of arr)
			result += x;
		return result;
	}
	
	
	const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
	
	
	const KANJI_BIT_SET: string =
		"0000000000000000000000010000000000000000C811350000000800000008000000000000000000000000000000000000000000000000000000000000000000" +
		"0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000EFFFBF30EFFFBF30000000000000" +
		"2000FFFFFFFFFFFFFFFF200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"000016333600D080000000000000000000000000000000000000000000000000800000000080000000000000000000000000F000000000000000410000000000" +
		"D890404618F10302000040003CC00000CC0000000200000000000000000000000000400000000000000000000000000000000000000000000000000000000000" +
		"0000000000000000000000000000000000000000000000000000000000000000F0099993939999994080000000000000000000003000C0030C8C000000080000" +
		"060000000000000050000000004A0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"FEFFF30100000000EFFFFFFFFFFFFFFFFFFFF087EFFFFFFFFFFFFFFFFFFFF7870000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"B8F63F34244264B9C28E0E3E4000A00456F563BD779794407DCE0F3E83065C80206E3043000815538C0EBAE700289689849A2492308E0608C14439DAA30C8654" +
		"06AA6568A7F304208838164102014712120220700003CB04426A26448A0602A071204758204048C9BFB7514142F72E11566BFE2057F1FF0207A304833C623676" +
		"9DD429020B649CF089CB05848368F30A8832618890E32325AA224A3EDD00C27C661A1E62B048A0F8BE72E955142CBB984100045816369480C0F70DA8E3FFFC50" +
		"A1FF308A14A704B7547420080050BE83158D50004399C01779300010663640420D081500000CA03417098C038000008599E0007F08F514000B00014981000826" +
		"04200D90002865104005108001D101501C48010052040501F014A8D49004D06A91BAC4190C121890584C30002560000840B08000D14090009484C50990000961" +
		"56C002222148334230C0697440A0522482008809009480F42A41AA3D038D78E3406816F14AE76814093C3B505A758112E14284A2821140A404A0B16106D00488" +
		"A0202059122806013420004044410008000040C00000000760A11C00A42000C000A104004041540492003BDB87A0B2509ABB0AFBC7049738CF21D18E6FB4965C" +
		"6FFEA440511220FF36DEB204330D24200001310020B1AC950A000020307A14C208842FF840200000008550010029840049811002400508430023C486AE94EB86" +
		"C48124E2028A9C129B050B08E100C7FFA9480E411C820E10E07894CAF031BDDDA1EBBF980E2A2A152055AC2364E3B829FBD1F8343076812382030C331180329A" +
		"000C56A33EF82040E4C25268D3FB1A00A1A34DC89C60C7130E00A059B810BDE0B43E02C82811010F49D7827ACA9CBF044844356009A544448CF3100084004D5F" +
		"107775CE244CD19838B682949014242DD160EF95008122A34E7BF9B3300FAE0C683120280898004E002B1A0108B44CC0903D4498FAF14384952854C0A0240540" +
		"040A8C010413054440040010082804508010C24403A650A16A024150FC0965461200001381C90FBC021A2E36C4015B10C83538A92B8B1823A78948A07E3320C0" +
		"CC4D81091A1A0709E1A8400E4D3C1540A9342C1244840135292004631420DB3F90BA0F8E0CD72D5A242CB42DF34AFA0D0AA11A4374288D30254CB156492DA38C" +
		"C1008C0460E04133F416B12B88000D0CA20A898A5C1AB66105E24B58B80C4060339F40E1E650152A0040836770CE8B37604423811804618CA8C79036089240AA" +
		"42C1C9ACE0E40672099000386400401811061801D0458090E000A0CC005000C00340440AB8004876882591A8E56881B895E2061401C8EBC91686C19800898000" +
		"0018A9808100091470041A4E5050D046E013D4E06084A0FF23618AA2E258B000008148AC02E0C6962300006185650930021582A1000842111E81623425D5AAE0" +
		"0AF082EAB7AF005480460498088C440C5009141B42484C4243A1A3060009491C6428A300D081601C22000199050E115175042800A140A020F4000398318DA444" +
		"20A822DE0C015004000120108088101300644020000F80700098002A000020220020016124000401002506204F250002015803280011202480345B081E0702A9" +
		"04021080005356CF1C9140BA682041267800440058094420C50458A07023083300400C8B02EC0D0C030C0800805052D009A004000020C0805056000412462014" +
		"862000004200C748200002ED91689404808000044800100200480101DC247C108307A25D8691F8D105EB21E35FE29D184CEC21428280E237CA4243B4C020D14D" +
		"20A20008790011804C114411687154D79D94946000041978C4524C8DAB44419429B1008C17200851180000C0A690002C00842004120394AB080208C1CA2E8001" +
		"400143001E00414802000002008941012C07AA408868024526C03140081901022804602004C1004538309E4E52120848334E00020C44906E30A06218AD211080" +
		"109609791004688FD42E1800E0A0156AA110CE18006C14488BDAC26BF64A147845D820B41611862006BB75020A0533400C8A4B7B204221103DA9000217228C00" +
		"1802E908A8C0081E900B151813018204E0A25A986B96E0265244441D580845D457C21BF1708DD268C78D1484E414E622002880E9C08F73DE08C8625731394180" +
		"23E0408CE4846AE6A4C207660C6210ABC03DD58100000000000000000000000000000000000004500207331818F45A30CE550146813C44322641430034A090A1" +
		"B7815A312010848A0440445C6018DD2E0FA184D2626B6140850504E6230821134E7000C08028A0240484B30806843178D05882439130925E5432A0789A5281C5" +
		"6A775C9D00E58E301800007A45DC6C140082402A068BA0B20200E9ADAE80A1E0C7240C11809867301268501000008A810A64844C50D022022245841910A87982" +
		"898780005061221304240880E4AF2A6041801129200240B925E23460000501091400AB5824030202B0F40A5080720804195039A105FD0060202A1203036008E4" +
		"4CC08C40400A10080006134D088020A000C1820081E814000DA601AC012F00B4D47260510220098800A58A289454051840020008408880C21D80500010084CA4" +
		"020E2600E80024A05503C8A6E0905A0E60924C2441843B08E308033B2010C1374941D00602C00490A103040C154A490CACD88C502C69C04A100040438C000110" +
		"D0559C9A8242A5C124107384D4A7F0014B23A254B7135029498B44C57D86A85479051DE234918024202D04D9048979029045D460000000000000000000000000" +
		"00000000000008482455124060C100714267011678FFDD9BF956A0C5D54200C30BDA950000000000000000000D82B9002240002080108044408904CAA0D88209" +
		"0078100E0040130049711228910045012BC2A12020C9300406D34088C08000978261C3AB046880BC47270809E10000000000008D881E78C94304214046EA1972" +
		"B68EBF6EF80466356AEEF735B23E4E5BF9682000845822102044008061120A02400040200002500000E74510C261CA1048A2580141C803503CBF349BAC000609" +
		"000623040021090803B018C4450020049200A6D100020820000840000162C05104081070D49D42C0018205811005020500010D400807102080103C1223100000" +
		"88009170208006502100E0C450401A0F2000000000000000000000000000000000000000000000000000000000000800D8E8A530DB1240A58843071162000000" +
		"00000001205C4088518B108FC741DE5206DE0BB198507DB13FA726A1C0D05CA01D5EA425094050364530442575B22161278A101194928100849080010006C688" +
		"E619F85021030993048F03940888B10000000000005824008500008940AE41078261D1163115000642A17A000000000000000C30021781012710729A40066098" +
		"220CC02000901804D2020AC843E0000000000000001210111108A11CC4CE298004000058CA7C6081E30E2150000801008004EC0810D6012014686580E1107200" +
		"0573D380230E50E40C104840180004100000000000000000000000000AA195008C34428884D1008C25103027310940400828004001A841D065088020040A4072" +
		"000000C400000000000000000000023A2091EA0A066200FD010F51B712180DA3081482003001008400CC4108FC414C0000020203100000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
		"0000000000000000000000000000000000000000000000000000000000000000A7FDFFFFFFFFFFFEFFFFFFF30000000000000000000000000000000082000000";
	
	
	initialize();
	
}
