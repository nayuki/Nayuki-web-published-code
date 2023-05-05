/*
 * Tax brackets visualizations
 *
 * Copyright (c) 2023 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/tax-brackets-visualizations
 */

"use strict";


(function() {
	
	let taxBrackets = [];
	let taxBracketsTotal = 0;
	
	let sliders = document.querySelectorAll("article .income-input input[type=range ]");
	let texts   = document.querySelectorAll("article .income-input input[type=number]");
	
	
	function taxBracketsChanged() {
		const config = document.querySelector("article #configuration");
		taxBrackets = [];
		taxBracketsTotal = 0;
		try {
			for (const line of config.value.split("\n")) {
				const parts = line.split(",");
				if (parts.length != 2)
					throw new Error("Invalid number of columns");
				const size = parseFloat(parts[0].trim());
				if (!isFinite(size) || size <= 0)
					throw new Error("Invalid bracket size");
				const rate = parseFloat(parts[1].trim());
				if (!isFinite(rate))
					throw new Error("Invalid bracket rate");
				taxBrackets.push([size, rate]);
				taxBracketsTotal += size;
			}
		} catch (e) {
			alert(e.message);
			return;
		}
		
		for (let elem of [...sliders, ...texts])
			elem.max = taxBracketsTotal.toString();
		grossIncomeChanged(Math.min(parseFloat(sliders[0].value), taxBracketsTotal));
	}
	
	document.querySelector("article #apply").onclick = taxBracketsChanged;
	
	taxBracketsChanged();
	
	
	for (let elem of [...sliders, ...texts])
		elem.oninput = () => grossIncomeChanged(parseFloat(elem.value));
	grossIncomeChanged(Math.max(Math.random() * taxBracketsTotal, 1));
	
	
	function grossIncomeChanged(grossIncome) {
		if (isNaN(grossIncome))
			grossIncome = 0;
		grossIncome = Math.round(Math.max(Math.min(grossIncome, taxBracketsTotal), 1));
		for (let elem of [...sliders, ...texts])
			elem.value = grossIncome.toString();
		
		let totalTax = 0;
		{
			let table = document.querySelector("article #table-visualization");
			let tbodys = table.querySelectorAll("tbody");
			
			tbodys[0].replaceChildren();
			let start = 0;
			let remainIncome = grossIncome;
			for (const [size, rate] of taxBrackets) {
				let tr = appendNewElem(tbodys[0], "tr");
				const end = start + size;
				appendNewElem(tr, "td", "$" + start.toFixed(0));
				appendNewElem(tr, "td", "$" + size .toFixed(0));
				appendNewElem(tr, "td", "$" + end  .toFixed(0));
				appendNewElem(tr, "td", (rate * 100).toFixed(1) + "%");
				const bracketGross = Math.min(remainIncome, size);
				const bracketTax = bracketGross * rate;
				const bracketNet = bracketGross - bracketTax;
				appendNewElem(tr, "td", bracketGross > 0 ? "$" + bracketGross.toFixed(0) : "");
				appendNewElem(tr, "td", bracketGross > 0 ? "$" + bracketTax  .toFixed(0) : "");
				appendNewElem(tr, "td", bracketGross > 0 ? "$" + bracketNet  .toFixed(0) : "");
				start = end;
				remainIncome -= bracketGross;
				totalTax += bracketTax;
			}
			
			let tds = tbodys[1].querySelectorAll("td");
			tds[1].textContent = (totalTax / grossIncome * 100).toFixed(1) + "%"
			tds[2].textContent = "$" + grossIncome.toFixed(0);
			tds[3].textContent = "$" + totalTax.toFixed(0);
			tds[4].textContent = "$" + (grossIncome - totalTax).toFixed(0);
		}
		
		{
			const WIDTH = 1000;
			const STROKE_WIDTH = 1;
			const BAR_HEIGHT = 150;
			const TEXT_SIZE = 15;
			const TEXT_GAP = 10;
			
			let svg = document.querySelector("article #chart-visualization");
			svg.style.fontSize = TEXT_SIZE + "px";
			svg.setAttribute("stroke-width", STROKE_WIDTH.toString());
			let groups = svg.querySelectorAll("g");
			for (let g of groups)
				g.replaceChildren();
			
			let bracketStart = 0;
			let remainIncome = grossIncome;
			let maxTextWidth = 0;
			for (let i = 0; i <= taxBrackets.length; i++) {
				const x = bracketStart / taxBracketsTotal * WIDTH;
				let text = groups[3].appendChild(document.createElementNS(svg.namespaceURI, "text"));
				text.textContent = "$" + bracketStart.toFixed(0);
				let bbox = text.getBBox();
				text.setAttribute("transform", `translate(${x} ${BAR_HEIGHT+TEXT_GAP}) rotate(-90) translate(${-bbox.width} ${-bbox.y-bbox.height/2})`);
				maxTextWidth = Math.max(bbox.width, maxTextWidth);
				if (i >= taxBrackets.length)
					break;
				
				const [size, rate] = taxBrackets[i];
				const bracketWidth = size / taxBracketsTotal * WIDTH;
				let rect = groups[2].appendChild(document.createElementNS(svg.namespaceURI, "rect"));
				rect.setAttribute("x", x.toString());
				rect.setAttribute("y", "0");
				rect.setAttribute("width", bracketWidth.toString());
				rect.setAttribute("height", BAR_HEIGHT.toString());
				
				const bracketGross = Math.min(remainIncome, size);
				if (bracketGross > 0) {
					const bracketTax = bracketGross * rate;
					const bracketNet = bracketGross - bracketTax;
					const partialWidth = bracketGross / taxBracketsTotal * WIDTH;
					
					let y = 0;
					let height = BAR_HEIGHT * (1 - rate);
					rect = groups[0].appendChild(document.createElementNS(svg.namespaceURI, "rect"));
					rect.setAttribute("x", x.toString());
					rect.setAttribute("y", y.toString());
					rect.setAttribute("width", partialWidth.toString());
					rect.setAttribute("height", height.toString());
					text = groups[3].appendChild(document.createElementNS(svg.namespaceURI, "text"));
					text.textContent = "$" + bracketNet.toFixed(0);
					bbox = text.getBBox();
					let dx;
					if (bbox.width > bracketWidth)
						dx = (bracketWidth - bbox.width) / 2;
					else if (bbox.width < partialWidth.toString())
						dx = (partialWidth - bbox.width) / 2;
					else
						dx = 0;
					text.setAttribute("x", (x + dx).toString());
					text.setAttribute("y", (y + (height - bbox.height) / 2 - bbox.y).toString());
					
					y = height;
					height = BAR_HEIGHT - y;
					rect = groups[1].appendChild(document.createElementNS(svg.namespaceURI, "rect"));
					rect.setAttribute("x", x.toString());
					rect.setAttribute("y", y.toString());
					rect.setAttribute("width", partialWidth.toString());
					rect.setAttribute("height", height.toString());
					text = groups[3].appendChild(document.createElementNS(svg.namespaceURI, "text"));
					text.textContent = "$" + bracketTax.toFixed(0);
					bbox = text.getBBox();
					if (bbox.width > bracketWidth)
						dx = (bracketWidth - bbox.width) / 2;
					else if (bbox.width < partialWidth)
						dx = (partialWidth - bbox.width) / 2;
					else
						dx = 0;
					text.setAttribute("x", (x + dx).toString());
					text.setAttribute("y", (y + (height - bbox.height) / 2 - bbox.y).toString());
				}
				bracketStart += size;
				remainIncome -= bracketGross;
			}
			
			const width = WIDTH + TEXT_SIZE;
			const height = BAR_HEIGHT + STROKE_WIDTH / 2 + TEXT_GAP + maxTextWidth;
			svg.style.aspectRatio = width + "/" + height;
			svg.setAttribute("viewBox", `${-TEXT_SIZE/2} ${-STROKE_WIDTH/2} ${width} ${height}`);
			document.querySelector("article #net-income").textContent = (grossIncome - totalTax).toFixed(0);
			document.querySelector("article #income-tax").textContent = totalTax.toFixed(0);
		}
	}
	
	
	function appendNewElem(container, tag, text) {
		let result = container.appendChild(document.createElement(tag));
		if (text !== undefined)
			result.textContent = text.toString();
		return result;
	}
	
})();
