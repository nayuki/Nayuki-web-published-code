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
	
	
	
	/*---- HTML UI initialization ----*/
	
	function initialize(): void {
		initShowHideSteps();
		doGenerate();
	}
	
	
	function initShowHideSteps(): void {
		let headings = document.querySelectorAll("article section h3");
		let showHideP = getElem("show-hide-steps");
		for (let heading of headings) {
			let parent = heading.parentNode as HTMLElement;
			const stepStr: string = (/^\d+(?=\. )/.exec(heading.textContent as string) as RegExpExecArray)[0];
			
			let label = document.createElement("label");
			let checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked=true;
			checkbox.id = "step" + stepStr;
			let onChange = () => {
				if (checkbox.checked) {
					parent.style.removeProperty("display");
					label.classList.add("checked");
				} else {
					parent.style.display = "none";
					label.classList.remove("checked");
				}
			};
			checkbox.onchange = onChange;
			onChange();
			
			label.htmlFor = checkbox.id;
			label.appendChild(checkbox);
			let span = document.createElement("span");
			span.textContent = stepStr;
			label.appendChild(span);
			showHideP.appendChild(label);
			
			let button = document.createElement("input");
			button.type = "button";
			button.value = "Hide";
			button.onclick = () => {
				checkbox.checked = false;
				onChange();
			};
			parent.insertBefore(button, heading);
		}
	}
	
	
	namespace maskShower {
		
		const MASK_DEPENDENT_ELEMS: Array<string> = [
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
		
		for (const id of MASK_DEPENDENT_ELEMS) {
			let elem = document.getElementById(id);
			if (!(elem instanceof Element))
				throw "Assertion error";
			let parent = elem.parentNode;
			if (!(parent instanceof HTMLElement))
				throw "Assertion error";
			for (let i = 0; i < 8; i++) {
				let node = elem.cloneNode(true) as Element;
				node.setAttribute("id", `${id}-${i}`);
				node.setAttribute("class", `${node.getAttribute("class")} ${id}`);
				parent.insertBefore(node, elem);
			}
			parent.removeChild(elem);
		}
		
		selectElem.onchange = showMask;
		showMask();
		
		export function showMask(): void {
			for (const id of MASK_DEPENDENT_ELEMS) {
				for (let i = 0; i < 8; i++) {
					let elem = document.getElementById(`${id}-${i}`) as Element;
					elem.setAttribute("style", i == selectElem.selectedIndex ? "" : "display:none");
				}
			}
		}
		
	}
	
	
	
	/*---- Main application ----*/
	
	export function doGenerate(ev?: Event) {
		if (ev !== undefined)
			ev.preventDefault();
		
		// Get input values
		const textStr: string = (getElem("input-text") as HTMLTextAreaElement).value;
		const minVer : int = parseInt(getInput("force-min-version" ).value, 10);
		let forceMask: int = parseInt(getInput("force-mask-pattern").value, 10);
		let errCorrLvl: ErrorCorrectionLevel;
		if      (getInput("errcorlvl-low"     ).checked)  errCorrLvl = ErrorCorrectionLevel.LOW     ;
		else if (getInput("errcorlvl-medium"  ).checked)  errCorrLvl = ErrorCorrectionLevel.MEDIUM  ;
		else if (getInput("errcorlvl-quartile").checked)  errCorrLvl = ErrorCorrectionLevel.QUARTILE;
		else if (getInput("errcorlvl-high"    ).checked)  errCorrLvl = ErrorCorrectionLevel.HIGH    ;
		else  throw "Assertion error";
		
		const text: Array<CodePoint> = CodePoint.toArray(textStr);
		const mode: SegmentMode = doStep0(text);
		const segs: Array<QrSegment> = [doStep1(text, mode)];
		const version: int = doStep2(segs, errCorrLvl, minVer);
		if (version == -1)
			return;
		
		const dataCodewords: Array<DataCodeword> = doStep3(segs, version, errCorrLvl);
		const qr = new QrCode(version, errCorrLvl);
		const allCodewords: Array<Codeword> = doStep4(qr, dataCodewords);
		doStep5(qr);
		doStep6(qr, allCodewords);
		
		let masks: Array<QrCode> = doStep7(qr);
		let penalties: Array<PenaltyInfo> = doStep8(qr, masks);
		let chosenMask: int = doStep9(penalties);
		if (forceMask != -1)
			chosenMask = forceMask;
		qr.applyMask(masks[chosenMask]);
		qr.drawFormatBits(chosenMask);
		qr.clearNewFlags();
		drawQrToSvg(qr, document.getElementById("output-qr-code") as Element);
		maskShower.selectElem.selectedIndex = chosenMask;
		maskShower.showMask();
	}
	
	
	function doStep0(text: Array<CodePoint>): SegmentMode {
		getElem("num-code-points").textContent = text.length.toString();
		let allNumeric  = true;
		let allAlphanum = true;
		let allKanji    = true;
		let tbody = clearChildren("#character-analysis tbody");
		text.forEach((cp, i) => {
			let tr = document.createElement("tr");
			const cells: Array<string|boolean> = [
				i.toString(),
				cp.utf16,
				"U+" + cp.utf32.toString(16).toUpperCase(),
				SegmentMode.isNumeric(cp.utf32),
				SegmentMode.isAlphanumeric(cp.utf32),
				true,
				SegmentMode.isKanji(cp.utf32),
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
		const data: Array<[string,boolean]> = [
			["Numeric"     , allNumeric ],
			["Alphanumeric", allAlphanum],
			["Byte"        , true       ],
			["Kanji"       , allKanji   ],
		];
		for (const row of data) {
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
		
		let result: SegmentMode;
		if (text.length == 0)
			result = SegmentMode.BYTE;
		else if (allNumeric)
			result = SegmentMode.NUMERIC;
		else if (allAlphanum)
			result = SegmentMode.ALPHANUMERIC;
		else
			result = SegmentMode.BYTE;
		// Kanji mode encoding is not supported due to big conversion table
		getElem("chosen-segment-mode").textContent = result.name;
		return result;
	}
	
	
	function doStep1(text: Array<CodePoint>, mode: SegmentMode): QrSegment {
		getElem("data-segment-chars").className = mode.name.toLowerCase() + " possibly-long";
		
		let bitData: Array<bit> = [];
		let numChars: int = text.length;
		let tbody = clearChildren("#data-segment-chars tbody");
		text.forEach((cp, i) => {
			let hexValues: string = "";
			let decValue: string = "";
			let rowSpan: int = 0;
			let combined: string = "";
			let bits: string = "";
			if (mode == SegmentMode.NUMERIC) {
				if (i % 3 == 0) {
					rowSpan = Math.min(3, text.length - i);
					const s: string = text.slice(i, i + rowSpan).map(c => c.utf16).join("");
					const temp: int = parseInt(s, 10);
					combined = temp.toString(10).padStart(rowSpan, "0");
					bits = temp.toString(2).padStart(rowSpan * 3 + 1, "0");
				}
			} else if (mode == SegmentMode.ALPHANUMERIC) {
				let temp: int = SegmentMode.ALPHANUMERIC_CHARSET.indexOf(cp.utf16);
				decValue = temp.toString(10);
				if (i % 2 == 0) {
					rowSpan = Math.min(2, text.length - i);
					if (rowSpan == 2) {
						temp *= SegmentMode.ALPHANUMERIC_CHARSET.length;
						temp += SegmentMode.ALPHANUMERIC_CHARSET.indexOf(text[i + 1].utf16);
					}
					combined = temp.toString(10);
					bits = temp.toString(2).padStart(rowSpan * 5 + 1, "0");
				}
			} else if (mode == SegmentMode.BYTE) {
				rowSpan = 1;
				const temp: Array<byte> = cp.utf8;
				hexValues = temp.map(c => c.toString(16).toUpperCase().padStart(2, "0")).join(" ");
				bits      = temp.map(c => c.toString( 2).toUpperCase().padStart(8, "0")).join("" );
				numChars += temp.length - 1;
			} else
				throw "Assertion error";
			for (const c of bits)
				bitData.push(parseInt(c, 2));
			
			let cells: Array<string> = [
				i.toString(),
				cp.utf16,
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
		getElem("segment-count").textContent = numChars + " " + (mode == SegmentMode.BYTE ? "bytes" : "characters");
		getElem("segment-data" ).textContent = bitData.length + " bits long";
		return new QrSegment(mode, numChars, bitData);
	}
	
	
	function doStep2(segs: Array<QrSegment>, ecl: ErrorCorrectionLevel, minVer: int): int {
		let trs = document.querySelectorAll("#segment-size tbody tr");
		[1, 10, 27].forEach((ver, i) => {
			const numBits = QrSegment.getTotalBits(segs, ver);
			const numCodewords = Math.ceil(numBits / 8);
			let tds = trs[i].querySelectorAll("td");
			tds[1].textContent = numBits < Infinity ? numBits.toString() : "Not encodable";
			tds[2].textContent = numCodewords < Infinity ? numCodewords.toString() : "Not encodable";
		});
		
		const ERRCORRLVLS = [
			ErrorCorrectionLevel.LOW,
			ErrorCorrectionLevel.MEDIUM,
			ErrorCorrectionLevel.QUARTILE,
			ErrorCorrectionLevel.HIGH
		];
		let tbody = clearChildren("#codewords-per-version tbody");
		let result: int = -1;
		for (let ver = 1; ver <= 40; ver++) {
			let tr = document.createElement("tr");
			let td = document.createElement("td");
			td.textContent = ver.toString();
			tr.appendChild(td);
			let numCodewords = Math.ceil(QrSegment.getTotalBits(segs, ver) / 8);
			ERRCORRLVLS.forEach(e => {
				let td = document.createElement("td");
				const capacityCodewords: int = QrCode.getNumDataCodewords(ver, e);
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
	
	
	function doStep3(segs: Array<QrSegment>, ver: int, ecl: ErrorCorrectionLevel): Array<DataCodeword> {
		let allBits: Array<bit> = [];
		let tbody = clearChildren("#segment-and-padding-bits tbody");
		function addRow(name: string, bits: Array<bit>): void {
			bits.forEach(b => allBits.push(b));
			let tr = document.createElement("tr");
			const cells: Array<string> = [
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
		
		const capacityBits: int = QrCode.getNumDataCodewords(ver, ecl) * 8;
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
		let result: Array<DataCodeword> = [];
		for (let i = 0; i < allBits.length; i += 8) {
			let cw = new DataCodeword(parseInt(allBits.slice(i, i + 8).join(""), 2));
			cw.preEccIndex = i / 8;
			result.push(cw);
		}
		getElem("all-data-codewords").textContent = result.map(cw => byteToHex(cw.value)).join(" ");
		return result;
	}
	
	
	function doStep4(qr: QrCode, data: Array<DataCodeword>): Array<Codeword> {
		const numBlocks: int = QrCode.NUM_ERROR_CORRECTION_BLOCKS[qr.errorCorrectionLevel.ordinal][qr.version];
		const blockEccLen: int = QrCode.ECC_CODEWORDS_PER_BLOCK  [qr.errorCorrectionLevel.ordinal][qr.version];
		const rawCodewords: int = Math.floor(QrCode.getNumRawDataModules(qr.version) / 8);
		const numShortBlocks: int = numBlocks - rawCodewords % numBlocks;
		const shortBlockLen: int = Math.floor(rawCodewords / numBlocks);
		let tds = document.querySelectorAll("#block-stats td:nth-child(2)");
		tds[0].textContent = data.length.toString();
		tds[1].textContent = numBlocks.toString();
		tds[2].textContent = (shortBlockLen - blockEccLen).toString();
		tds[3].textContent = numShortBlocks < numBlocks ? (shortBlockLen - blockEccLen + 1).toString() : "N/A";
		tds[4].textContent = blockEccLen.toString();
		tds[5].textContent = numShortBlocks.toString();
		tds[6].textContent = (numBlocks - numShortBlocks).toString();
		
		let dataBlocks: Array<Array<DataCodeword>> = qr.splitIntoBlocks(data);
		let eccBlocks: Array<Array<EccCodeword>> = qr.computeEccForBlocks(dataBlocks);
		{
			let thead = queryElem("#blocks-and-ecc thead");
			if (thead.children.length >= 2)
				thead.removeChild(thead.children[1]);
			(thead.querySelectorAll("th")[1] as HTMLTableHeaderCellElement).colSpan = numBlocks;
			let tr = document.createElement("tr");
			for (let i = 0; i < numBlocks; i++) {
				let th = document.createElement("th");
				th.textContent = i.toString();
				tr.appendChild(th);
			}
			thead.appendChild(tr);
		} {
			let tbody = clearChildren("#blocks-and-ecc tbody");
			let verticalTh = document.createElement("th");
			verticalTh.textContent = "Codeword index within block";
			verticalTh.rowSpan = shortBlockLen;  // Not final value; work around Firefox bug
			for (let i = 0; i < shortBlockLen + 1; i++) {
				const isDataRow: boolean = i < shortBlockLen + 1 - blockEccLen;
				let tr = document.createElement("tr");
				tr.className = isDataRow ? "data" : "ecc";
				
				if (i == 0)
					tr.appendChild(verticalTh);
				let th = document.createElement("th");
				th.textContent = i.toString();
				tr.appendChild(th);
				
				if (isDataRow) {
					dataBlocks.forEach(block => {
						let td = document.createElement("td");
						if (i < block.length)
							td.textContent = byteToHex(block[i].value);
						tr.appendChild(td);
					});
				} else {
					eccBlocks.forEach(block => {
						let td = document.createElement("td");
						td.textContent = byteToHex(block[i - (shortBlockLen + 1 - blockEccLen)].value);
						tr.appendChild(td);
					});
				}
				tbody.appendChild(tr);
			}
			tbody.clientHeight;  // Read property to force reflow in Firefox
			verticalTh.rowSpan = shortBlockLen + 1;
		}
		
		let result: Array<Codeword> = qr.interleaveBlocks(dataBlocks, eccBlocks);
		let output = clearChildren("#interleaved-codewords");
		let span = document.createElement("span");
		span.textContent = result.slice(0, data.length).map(cw => byteToHex(cw.value)).join(" ");
		span.className = "data";
		output.appendChild(span);
		output.appendChild(document.createTextNode(" "));
		span = document.createElement("span");
		span.textContent = result.slice(data.length).map(cw => byteToHex(cw.value)).join(" ");
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
	
	
	function doStep6(qr: QrCode, allCodewords: Array<Codeword>): void {
		const zigZagScan: Array<[int,int]> = qr.makeZigZagScan();
		let zigZagSvg = document.getElementById("zig-zag-scan") as Element;
		drawQrToSvg(qr, zigZagSvg);
		{
			let s = "";
			for (const [x, y] of zigZagScan)
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
			let mask = qr.makeMask(i);
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
	
	
	function doStep8(qr: QrCode, masks: Array<QrCode>): Array<PenaltyInfo> {
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
		
		return masks.map((mask, maskIndex) => {
			qr.applyMask(mask);
			qr.drawFormatBits(maskIndex);
			qr.clearNewFlags();
			const penaltyInfo = qr.computePenalties();
			{
				let [svg, group] = getAndDrawSvg("horizontal-runs", maskIndex);
				penaltyInfo.horizontalRuns.forEach(
					run => appendRect(group, run.startX, run.startY, run.runLength, 1));
			} {
				let [svg, group] = getAndDrawSvg("vertical-runs", maskIndex);
				penaltyInfo.verticalRuns.forEach(
					run => appendRect(group, run.startX, run.startY, 1, run.runLength));
			} {
				let [svg, group] = getAndDrawSvg("two-by-two-boxes", maskIndex);
				penaltyInfo.twoByTwoBoxes.forEach(
					([x, y]) => appendRect(group, x, y, 2, 2));
			} {
				let [svg, group] = getAndDrawSvg("horizontal-false-finders", maskIndex);
				penaltyInfo.horizontalFalseFinders.forEach(
					run => appendRect(group, run.startX, run.startY, run.runLength, 1));
			} {
				let [svg, group] = getAndDrawSvg("vertical-false-finders", maskIndex);
				penaltyInfo.verticalFalseFinders.forEach(
					run => appendRect(group, run.startX, run.startY, 1, run.runLength));
			} {
				let tds = document.querySelectorAll(`#black-white-balance-${maskIndex} td:nth-child(2)`);
				const total = qr.size * qr.size;
				const black = penaltyInfo.numBlackModules;
				const percentBlack = black * 100 / total;
				tds[0].textContent = qr.size.toString();
				tds[1].textContent = total.toString();
				tds[2].textContent = (total - black).toString();
				tds[3].textContent = black.toString();
				tds[4].textContent = percentBlack.toFixed(3) + "%";
				tds[5].textContent = (percentBlack - 50).toFixed(3).replace(/-/, "\u2212") + "%";
			}
			qr.applyMask(mask);
			return penaltyInfo;
		});
	}
	
	
	function doStep9(penalties: Array<PenaltyInfo>): int {
		let tbody = clearChildren("#select-best-mask");
		let result = -1;
		let minPenalty = Infinity;
		penalties.forEach((penaltyInfo, maskNum) => {
			const totalPoints = sumArray(penaltyInfo.penaltyPoints);
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
		const hasUnfilled: boolean = qr.modules.some(
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
		let blackPath = document.createElementNS(svg.namespaceURI, "path");
		whitePath.setAttribute("class", "white");
		blackPath.setAttribute("class", "black");
		whitePath.setAttribute("d", whites);
		blackPath.setAttribute("d", blacks);
		svg.appendChild(whitePath);
		svg.appendChild(blackPath);
		
		function isModuleNew(x: int, y: int) {
			if (!(0 <= x && x < qr.size && 0 <= y && y < qr.size))
				return false;
			const m = qr.modules[x][y];
			return m instanceof FilledModule && m.isNew;
		}
		let news = "";
		for (let x = 0; x <= qr.size; x++) {
			for (let y = 0; y <= qr.size; y++) {
				if (isModuleNew(x - 1, y) != isModuleNew(x, y))
					news += `M${x},${y}v1`;
				if (isModuleNew(x, y - 1) != isModuleNew(x, y))
					news += `M${x},${y}h1`;
			}
		}
		let newPath = document.createElementNS(svg.namespaceURI, "path");
		newPath.setAttribute("class", "new");
		newPath.setAttribute("d", news);
		svg.appendChild(newPath);
	}
	
	
	
	/*---- Simple utility functions ----*/
	
	function getElem(id: string): HTMLElement {
		const result = document.getElementById(id);
		if (result instanceof HTMLElement)
			return result;
		throw "Assertion error";
	}
	
	
	function getInput(id: string): HTMLInputElement {
		const result = getElem(id);
		if (result instanceof HTMLInputElement)
			return result;
		throw "Assertion error";
	}
	
	
	function queryElem(q: string): HTMLElement {
		const result = document.querySelector(q);
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
	
	
	function byteToHex(val: byte): string {
		return val.toString(16).toUpperCase().padStart(2, "0");
	}
	
	
	function intToBits(val: int, len: int): Array<bit> {
		if (len < 0 || len > 31 || val >>> len != 0)
			throw "Value out of range";
		let result: Array<bit> = [];
		for (let i = len - 1; i >= 0; i--)
			result.push((val >>> i) & 1);
		return result;
	}
	
	
	
	/*---- Helper class ----*/
	
	class CodePoint {
		
		public static toArray(s: string): Array<CodePoint> {
			let result: Array<CodePoint> = [];
			for (let i = 0; i < s.length; i++) {
				const c: int = s.charCodeAt(i);
				if (0xD800 <= c && c < 0xDC00) {
					if (i + 1 >= s.length)
						throw "Invalid UTF-16 string";
					i++;
					const d: int = s.charCodeAt(i);
					result.push(new CodePoint(((c & 0x3FF) << 10 | (d & 0x3FF)) + 0x10000));
				} else if (0xDC00 <= c && c < 0xE000)
					throw "Invalid UTF-16 string";
				else
					result.push(new CodePoint(c));
			}
			return result;
		}
		
		
		public readonly utf8: Array<byte>;
		public readonly utf16: string;
		
		private constructor(
				public readonly utf32: int) {
			
			if (utf32 < 0x10000)
				this.utf16 = String.fromCharCode(utf32);
			else {
				this.utf16 = String.fromCharCode(
					0xD800 | ((utf32 - 0x10000) >>> 10),
					0xDC00 | ((utf32 - 0x10000) & 0x3FF));
			}
			
			if (utf32 < 0)
				throw "Invalid code point";
			else if (utf32 < 0x80)
				this.utf8 = [utf32];
			else {
				let n: int;
				if      (utf32 <    0x800)  n = 2;
				else if (utf32 <  0x10000)  n = 3;
				else if (utf32 < 0x110000)  n = 4;
				else  throw "Invalid code point";
				this.utf8 = [];
				for (let i = 0; i < n; i++, utf32 >>>= 6)
					this.utf8.push(0x80 | (utf32 & 0x3F));
				this.utf8.reverse();
				this.utf8[0] |= (0xF00 >>> n) & 0xFF;
			}
		}
		
	}
	
	
	initialize();
	
}
