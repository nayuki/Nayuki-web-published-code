/* 
 * Band-limited square waves (JavaScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/band-limited-square-waves
 */

"use strict";


/*---- Main application logic ----*/

// Constant values
// Workaround: Google Chrome seems to need a 44.1 kHz sample rate to avoid clicks at the end of each block;
// Mozilla Firefox can work with 44.1 and 48 kHz sample rates equally well.
const SAMPLE_RATE = 44100;
const MIN_FREQUENCY = parseFloat(document.getElementById("frequency-number").min);
const MAX_FREQUENCY = parseFloat(document.getElementById("frequency-number").max);

// State variables
let audioContext = new AudioContext();
let state = null;


// Reads HTML form elements and updates the 'state' object.
function updateWaveParams() {
	if (state === null)
		return;
	
	const elems = document.querySelectorAll("input[type=radio][name=wave-type]");
	for (const elem of elems) {
		if (elem.checked)
			state.waveType = elem.value;
	}
	
	state.frequency = parseFloat(document.getElementById("frequency-number").value);
	state.dutyCycle = parseFloat(document.getElementById("duty-cycle-number").value);
	state.volume    = parseFloat(document.getElementById("volume-number").value) / 100;
	
	state.increment = state.frequency / SAMPLE_RATE;
	if (state.waveType == "square-bandlimited") {
		state.bandAmplitudes = [state.dutyCycle * 2 - 1];
		for (let i = 1; i * state.frequency <= SAMPLE_RATE / 2; i++)
			state.bandAmplitudes.push(4 * Math.sin(i * state.dutyCycle * Math.PI) / (i * Math.PI));
	}
}


// Starts or stops the wave playback.
function toggleWave() {
	if (state === null) {  // Start playing
		state = {
			phase: 0,
			// Workaround: Mozilla Firefox needs a bit of delay to ensure seamless playback; Google Chrome doesn't.
			nextStart: audioContext.currentTime + 0.1,
			src0: null,
			src1: null,
		};
		updateWaveParams();
		renderNext();
		renderNext();
		
	} else {  // Stop playing
		state.src0.onended = null;
		state.src1.onended = null;
		state.src0.stop();
		state.src1.stop();
		state = null;
	}
}


// Note: This updates the state variables phase, src0, src1.
function renderNext() {
	if (state === null)
		throw new Error("Illegal state");
	let buf = audioContext.createBuffer(1, Math.floor(SAMPLE_RATE / 4), SAMPLE_RATE);
	let data = buf.getChannelData(0);
	let phase = state.phase;
	const type = state.waveType;
	const inc = state.increment;
	const vol = state.volume;
	
	if (type == "sine") {
		for (let i = 0; i < buf.length; i++) {
			data[i] = Math.cos(phase * Math.PI * 2) * vol;
			phase = (phase + inc) % 1;
		}
		
	} else if (type == "square-naive") {
		const duty = state.dutyCycle;
		for (let i = 0; i < buf.length; i++) {
			data[i] = (phase + duty / 2) % 1 < duty ? vol : -vol;
			phase = (phase + inc) % 1;
		}
		
	} else if (type == "square-bandlimited") {
		const amps = state.bandAmplitudes;
		for (let i = 0; i < buf.length; i++) {
			let val = amps[0];
			let baseCos = Math.cos(phase * Math.PI * 2);
			let baseSin = Math.sin(phase * Math.PI * 2);
			let phasorCos = baseCos;
			let phasorSin = baseSin;
			for (let j = 1; j < amps.length; j++) {
				// At this point, phasorCos == Math.cos(j * phase * Math.PI * 2), except for rounding error
				val += amps[j] * phasorCos;
				let temp  = phasorCos * baseCos - phasorSin * baseSin;
				phasorSin = phasorSin * baseCos + phasorCos * baseSin;
				phasorCos = temp;
			}
			data[i] = val * vol;
			phase = (phase + inc) % 1;
		}
		
	} else
		throw new Error("Assertion error");
	state.phase = phase;
	
	state.src0 = state.src1;
	state.src1 = audioContext.createBufferSource();
	state.src1.buffer = buf;
	state.src1.connect(audioContext.destination);
	state.src1.onended = renderNext;
	state.src1.start(state.nextStart);
	state.nextStart += buf.length / SAMPLE_RATE;
}



/*---- Form input handlers ----*/

function frequencySliderChanged() {
	const sliderElem = document.getElementById("frequency-slider");
	let numberElem = document.getElementById("frequency-number");
	let val = parseFloat(sliderElem.value) / parseFloat(sliderElem.max);
	val = Math.pow(MAX_FREQUENCY / MIN_FREQUENCY, val) * MIN_FREQUENCY;
	numberElem.value = val.toFixed(3);
	updateNumHarmonics();
	updateWaveParams();
}


function frequencyNumberChanged() {
	let sliderElem = document.getElementById("frequency-slider");
	const numberElem = document.getElementById("frequency-number");
	let val = parseFloat(numberElem.value);
	if (val < parseFloat(numberElem.min) || val > parseFloat(numberElem.max))
		return;
	val = Math.log(val / MIN_FREQUENCY) / Math.log(MAX_FREQUENCY / MIN_FREQUENCY);
	sliderElem.value = (val * parseFloat(sliderElem.max)).toString();
	updateNumHarmonics();
	updateWaveParams();
}


function updateNumHarmonics() {
	const freq = parseFloat(document.getElementById("frequency-number").value);
	let elem = document.getElementById("num-harmonics");
	while (elem.firstChild !== null)
		elem.removeChild(elem.firstChild);
	const text = `floor(${SAMPLE_RATE / 2} / ${freq.toFixed(3)}) = ${Math.floor((SAMPLE_RATE / 2) / freq)}`;
	elem.textContent = text;
}


function dutyCycleSliderChanged() {
	const sliderElem = document.getElementById("duty-cycle-slider");
	let numberElem = document.getElementById("duty-cycle-number");
	const val = parseFloat(sliderElem.value) / parseFloat(sliderElem.max);
	numberElem.value = val.toFixed(3);
	updateWaveParams();
}


function dutyCycleNumberChanged() {
	let sliderElem = document.getElementById("duty-cycle-slider");
	const numberElem = document.getElementById("duty-cycle-number");
	const val = parseFloat(numberElem.value);
	if (val < parseFloat(numberElem.min) || val > parseFloat(numberElem.max))
		return;
	sliderElem.value = (val * parseFloat(sliderElem.max)).toString();
	updateWaveParams();
}


function volumeSliderChanged() {
	const sliderElem = document.getElementById("volume-slider");
	let numberElem = document.getElementById("volume-number");
	const val = parseFloat(sliderElem.value) / parseFloat(sliderElem.max);
	numberElem.value = (val * 100).toFixed(1);
	updateWaveParams();
}


function volumeNumberChanged() {
	let sliderElem = document.getElementById("volume-slider");
	const numberElem = document.getElementById("volume-number");
	const val = parseFloat(numberElem.value) / 100;
	if (val < parseFloat(numberElem.min) || val > parseFloat(numberElem.max))
		return;
	sliderElem.value = (val * parseFloat(sliderElem.max)).toString();
	updateWaveParams();
}


// UI initialization
frequencyNumberChanged();
dutyCycleNumberChanged();
volumeNumberChanged();
