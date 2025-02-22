/* 
 * Tap to measure tempo
 * 
 * Copyright (c) 2025 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/tap-to-measure-tempo-javascript
 */

"use strict";


const app = new function() {
	
	let container = document.querySelector("article .program-container");
	
	let simpleBeatsElem         = container.querySelector("output.simple-beats"        );
	let simplePositionElem      = container.querySelector("output.simple-position"     );
	let simpleTimeElem          = container.querySelector("output.simple-time"         );
	let advancedStdDevElem      = container.querySelector("output.advanced-std-dev"    );
	let advancedOffsetElem      = container.querySelector("output.advanced-offset"     );
	let advancedCorrelationElem = container.querySelector("output.advanced-correlation");
	let simpleLastDevElem       = container.querySelector("output.simple-last-dev"     );
	let advancedLastDevElem     = container.querySelector("output.advanced-last-dev"   );
	let simplePeriodElem        = container.querySelector("output.simple-period"       );
	let advancedPeriodElem      = container.querySelector("output.advanced-period"     );
	let simpleTempoElem         = container.querySelector("output.simple-tempo"        );
	let advancedTempoElem       = container.querySelector("output.advanced-tempo"      );
	let doneButton              = container.querySelector("button.done"                );
	
	
	function initialize() {
		container.hidden = false;
		window.addEventListener("keydown", doBeat);
	}
	
	setTimeout(initialize);
	
	
	class State {
		
		constructor() {
			this.beatTimes = [];
			this.xSum  = 0;
			this.xxSum = 0;
			this.ySum  = 0;
			this.yySum = 0;
			this.xySum = 0;
			this.periodPrev = NaN;
			this.aPrev = NaN;
			this.bPrev = NaN;
			this.periodCur = NaN;
			this.aCur = NaN;
			this.bCur = NaN;
		}
		
		
		addBeat(time) {
			// Add beat
			this.beatTimes.push(time);
			const n = this.beatTimes.length;
			
			// Coordinates for linear regression
			const x = n - 1;
			const y = this.beatTimes[n - 1] - this.beatTimes[0];
			
			// Regression cumulative variables
			this.xSum  += x;
			this.xxSum += x * x;
			this.ySum  += y;
			this.yySum += y * y;
			this.xySum += x * y;
			
			// Regression linear parameters
			this.periodPrev = this.periodCur;
			this.aPrev = this.aCur;
			this.bPrev = this.bCur;
			const xx = n * this.xxSum - this.xSum * this.xSum;
			const yy = n * this.yySum - this.ySum * this.ySum;
			const xy = n * this.xySum - this.xSum * this.ySum;
			this.periodCur = y / x;
			this.aCur = (n * this.xySum - this.xSum * this.ySum) / xx;  // Slope
			this.bCur = (this.ySum * this.xxSum - this.xSum * this.xySum) / xx;  // Intercept
			
			return {n, x, y, xx, yy, xy, period: this.periodCur};
		}
		
	}
	
	
	let state = new State();
	
	
	function doBeat() {
		if (state === null)
			return;
		const info = state.addBeat(Date.now());
		
		simpleBeatsElem.textContent = info.n.toString();
		simpleTimeElem.textContent = (info.y / 1000).toFixed(3) + NBSP + "s";
		const tempo = 60000 * info.x / info.y;
		if (info.n < 8 || tempo < 190)  // One tap per beat
			simplePositionElem.textContent = "Bar " + Math.floor(info.x / 4) + " : Beat " + info.x % 4;
		else  // Two taps per beat
			simplePositionElem.textContent = "Bar " + Math.floor(info.x / 8) + " : Beat " + Math.floor(info.x / 2) % 4 + "." + info.x % 2 * 5;
		
		// Period and tempo
		if (info.n < 2)
			return;
		simpleTempoElem.textContent = tempo.toFixed(2) + NBSP + "BPM";
		simplePeriodElem.textContent = info.period.toFixed(2) + NBSP + "ms";
		advancedPeriodElem.textContent = state.aCur.toFixed(3) + NBSP + "ms";
		advancedOffsetElem.textContent = state.bCur.toFixed(2).replace(/-/, MINUS) + NBSP + "ms";
		advancedCorrelationElem.textContent = (info.xy * info.xy / (info.xx * info.yy)).toFixed(9);
		advancedTempoElem.textContent = (60000 / state.aCur).toFixed(3) + NBSP + "BPM";
		
		// Deviation from prediction
		if (info.n < 3)
			return;
		const simpleLastDev = state.periodPrev * info.x - info.y;
		simpleLastDevElem.textContent = Math.abs(simpleLastDev).toFixed(1) + NBSP + "ms " + (simpleLastDev < 0 ? "late" : "early");
		const advancedLastDev = state.aPrev * info.x + state.bPrev - info.y;
		advancedStdDevElem.textContent = Math.sqrt(((info.yy - info.xy * info.xy / info.xx) / info.n) / (info.n - 2)).toFixed(2) + NBSP + "ms";
		advancedLastDevElem.textContent = Math.abs(advancedLastDev).toFixed(1) + NBSP + "ms " + (advancedLastDev < 0 ? "late" : "early");
	}
	
	
	this.doReset = function() {
		state = new State();
		[
			simpleBeatsElem,
			simplePositionElem,
			simpleTimeElem,
			advancedStdDevElem,
			advancedOffsetElem,
			advancedCorrelationElem,
			simpleLastDevElem,
			advancedLastDevElem,
			simplePeriodElem,
			advancedPeriodElem,
			simpleTempoElem,
			advancedTempoElem,
		].forEach(el => el.textContent = "");
		doneButton.disabled = false;
	};
	
	
	this.doDone = function() {
		state = null;
		[
			simplePositionElem,
			simpleLastDevElem,
			advancedLastDevElem,
		].forEach(el => el.textContent = "");
		doneButton.disabled = true;
	};
	
	
	const NBSP = "\u00A0";
	const MINUS = "\u2212";
	
};
