/* 
 * Image unshredder demo (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/image-unshredder-by-annealing
 */


namespace app {
	
	type int = number;
	
	
	
	/*---- Configuration constants ----*/
	
	const DEMO_IMAGES: Array<[string,string,string,string]> = [
		["Abstract Light Painting", "abstract-light-painting.png", "Alexander Nie"           , "https://www.flickr.com/photos/niephotography/15821646318/"],
		["Alaska Railroad"        , "alaska-railroad.png"        , "Luke Jones"              , "https://www.flickr.com/photos/befuddledsenses/7392384974/"],
		["Blue Hour in Paris"     , "blue-hour-paris.png"        , "Falcon\u00AE Photography", "https://www.flickr.com/photos/falcon_33/15178077733/"     ],
		["Lower Kananaskis Lake"  , "lower-kananaskis-lake.png"  , "davebloggs007"           , "https://www.flickr.com/photos/davebloggs007/15223201038/" ],
		["Marlet 2 Radio Board"   , "marlet2-radio-board.png"    , "Adam Greig"              , "https://www.flickr.com/photos/randomskk/14915187162/"     ],
		["Nikos\u2019s Cat"       , "nikos-cat.png"              , "Nikos Koutoulas"         , "https://www.flickr.com/photos/33284937@N04/8854205418/"   ],
		["Pizza food wallpaper"   , "pizza-food-wallpaper.png"   , "Michael Stern"           , "https://www.flickr.com/photos/68711844@N07/15204301893/"  ],
		["The Enchanted Garden"   , "the-enchanted-garden.png"   , "Julie Geiger"            , "https://www.flickr.com/photos/julesbeans/11318885443/"    ],
		["Tokyo Skytree Aerial"   , "tokyo-skytree-aerial.png"   , "IQRemix"                 , "https://www.flickr.com/photos/iqremix/18088821468/"       ],
	];
	
	// Performance tuning
	const YIELD_AFTER_TIME: number = 20;  // In milliseconds; a long computation relinquishes/yields after this amount of time; short will mean high execution overhead; long will mean the GUI hangs
	const ANNEAL_REDRAW_TIME: number = 300;  // In milliseconds; the minimum amount of time between image and text updates when performing annealing
	
	
	
	/*---- HTML input/output elements ----*/
	
	let canvas = queryElem("canvas", HTMLCanvasElement);
	let graphics: CanvasRenderingContext2D;
	{
		const temp = canvas.getContext("2d");
		if (!(temp instanceof CanvasRenderingContext2D))
			throw new Error("Assertion error");
		graphics = temp;
	}
	
	let imageSelect = queryElem("select#image-select", HTMLSelectElement);
	let numberIterationsInput = queryElem("input#number-iterations", HTMLInputElement);
	let startTemperatureInput = queryElem("input#start-temperature", HTMLInputElement);
	let shuffleButton = queryElem("button.shuffle", HTMLButtonElement);
	let annealButton  = queryElem("button.anneal" , HTMLButtonElement);
	let stopButton    = queryElem("button.stop"   , HTMLButtonElement);
	
	let imageAttribution = queryElem("a.image-attribution", HTMLAnchorElement);
	let curIterationsElem  = queryElem("td.current-iterations" , HTMLElement);
	let curTemperatureElem = queryElem("td.current-temperature", HTMLElement);
	let curEnergyElem      = queryElem("td.current-energy"     , HTMLElement);
	
	
	type Constructor<T> = { new(...args: Array<any>): T };
	
	function queryElem<T>(query: string, type: Constructor<T>): T {
		const result: Element|null = document.querySelector("article " + query);
		if (result instanceof type)
			return result;
		else if (result === null)
			throw new Error("Element not found");
		else
			throw new TypeError("Invalid element type");
	}
	
	
	function setButtonsBusy(busy: boolean): void {
		if (busy) {
			imageSelect.disabled = true;
			shuffleButton.disabled = true;
			annealButton.disabled = true;
			stopButton.disabled = stopButton.onclick === null;
		} else {
			imageSelect.disabled = false;
			shuffleButton.disabled = shuffleButton.onclick === null;
			annealButton.disabled = annealButton.onclick === null;
			stopButton.disabled = true;
			stopButton.onclick = null;
		}
	}
	
	
	
	/*---- Main program ----*/
	
	for (const [title,,,] of DEMO_IMAGES) {
		let option: HTMLElement = document.createElement("option");
		option.textContent = title;
		imageSelect.appendChild(option);
	}
	imageSelect.onchange = imageSelectChanged;
	setTimeout(imageSelectChanged);
	
	
	function imageSelectChanged(): void {
		shuffleButton.onclick = null;
		annealButton.onclick = null;
		stopButton.onclick = null;
		setButtonsBusy(true);
		
		const [title, fileName, author, attributionUrl] = DEMO_IMAGES[imageSelect.selectedIndex];
		let baseImage: HTMLImageElement = new Image();
		baseImage.onload = imageLoaded;
		baseImage.src = "/res/image-unshredder-by-annealing/" + fileName;
		imageAttribution.textContent = "by " + author;
		imageAttribution.href = attributionUrl;
		
		curIterationsElem.textContent  = "\u2012";
		curTemperatureElem.textContent = "\u2012";
		curEnergyElem.textContent      = "\u2012";
		
		
		function imageLoaded(): void {
			const width : int = canvas.width  = baseImage.width ;
			const height: int = canvas.height = baseImage.height;
			graphics.drawImage(baseImage, 0, 0, width, height);
			shuffleButton.onclick = startShuffle;
			setButtonsBusy(false);
			
			
			function startShuffle(): void {
				graphics.drawImage(baseImage, 0, 0, width, height);
				let shuffledImage: ImageData = graphics.getImageData(0, 0, width, height);
				let columnDiffs: Array<Uint32Array> = [];
				
				{
					let timeout: int|null = null;
					annealButton.onclick = null;
					stopButton.onclick = (): void => {
						if (timeout !== null) {
							clearTimeout(timeout);
							timeout = null;
						}
						setButtonsBusy(false);
					};
					setButtonsBusy(true);
					
					curIterationsElem.textContent  = "\u2012";
					curTemperatureElem.textContent = "\u2012";
					curEnergyElem.textContent      = "\u2012";
					
					const doShuffle = function(i: int): void {
						const startTime: number = Date.now();
						timeout = null;
						let pixels: Uint8ClampedArray = shuffledImage.data;
						while (i < width) {
							// Pick a random column j in the range [i, width) and move it to position i.
							// This Fisher-Yates shuffle is the less efficient than the Durstenfeld shuffle but more animatedly appealing.
							const j: int = i + Math.floor(Math.random() * (width - i));
							for (let y = 0; y < height; y++) {
								for (let x = j - 1; x >= i; x--) {
									const off: int = (y * width + x) * 4;
									for (let k = 0; k < 4; k++) {
										const temp: int = pixels[off + k];
										pixels[off + k] = pixels[off + 4 + k];
										pixels[off + 4 + k] = temp;
									}
								}
							}
							i++;
							if (Date.now() - startTime > YIELD_AFTER_TIME)
								break;
						}
						graphics.putImageData(shuffledImage, 0, 0);
						
						// Continue shuffling or finish
						if (i < width)
							timeout = setTimeout(doShuffle, 0, i);
						else {
							annealButton.onclick = startAnneal;
							setButtonsBusy(false);
						}
					}
					
					doShuffle(0);
				}
				
				
				function startAnneal(): void {
					const numIterations: number = Math.round(parseFloat(numberIterationsInput.value) * 1e6);
					if (numIterations <= 0) {
						alert("Number of iterations must be positive");
						return;
					}
					const startTemperature: number = Math.round(parseFloat(startTemperatureInput.value));
					
					let timeout: int|null = null;
					stopButton.onclick = (): void => {
						if (timeout !== null) {
							clearTimeout(timeout);
							timeout = null;
						}
						setButtonsBusy(false);
					};
					setButtonsBusy(true);
					
					let curIteration: int = 0;
					let curEnergy: number = 0;
					let colPermutation: Array<int> = [];
					let annealingLastDrawTime: number|null = null;
					doAnnealPrecompute();
					
					function doAnnealPrecompute(): void {
						const startTime: number = Date.now();
						timeout = null;
						const pixels: Uint8ClampedArray = shuffledImage.data;
						while (columnDiffs.length < width) {
							const i: int = columnDiffs.length;
							let entry = new Uint32Array(width);
							for (let j = 0; j < width; j++) {
								if (i <= j)
									entry[j] = lineDiff(pixels, width, height, i, j);
								else
									entry[j] = columnDiffs[j][i];
							}
							columnDiffs.push(entry);
							if (Date.now() - startTime > YIELD_AFTER_TIME)
								break;
						}
						
						// Continue precomputing or finish
						if (columnDiffs.length < width) {
							curIterationsElem.textContent = "Precomputing...";
							timeout = setTimeout(doAnnealPrecompute);
						} else {
							for (let i = 0; i < width - 1; i++)
								curEnergy += columnDiffs[i][i + 1];
							for (let i = 0; i < width; i++)
								colPermutation.push(i);
							annealingLastDrawTime = Date.now();
							doAnneal();
						}
					}
					
					
					function lineDiff(pixels: Uint8ClampedArray, width: int, height: int, x0: int, x1: int): int {
						let sum: int = 0;
						for (let y = 0; y < height; y++) {
							const off0: int = (y * width + x0) * 4;
							const off1: int = (y * width + x1) * 4;
							for (let i = 0; i < 3; i++)
								sum += Math.abs(pixels[off0 + i] - pixels[off1 + i]);
						}
						return sum;
					}
					
					
					function doAnneal(): void {
						const startTime: number = Date.now();
						timeout = null;
						let t: number = -1;
						let temperature: number = -1;
						let perm: Array<int> = colPermutation;
						while (curIteration < numIterations) {
							t = curIteration / numIterations;
							temperature = (1 - t) * startTemperature;
							
							// Randomly choose two distinct columns
							const col0: int = Math.floor(Math.random() * width);
							const col1: int = Math.floor(Math.random() * width);
							if (col0 != col1) {
								// Calculate the change in energy if the col0 were removed and inserted at col1
								let energyDiff: number = 0;
								if (col0 >= 1)
									energyDiff -= columnDiffs[perm[col0 - 1]][perm[col0]];
								if (col0 + 1 < width)
									energyDiff -= columnDiffs[perm[col0]][perm[col0 + 1]];
								if (col0 >= 1 && col0 + 1 < width)
									energyDiff += columnDiffs[perm[col0 - 1]][perm[col0 + 1]];
								if (col1 < col0) {
									if (col1 >= 1) {
										energyDiff -= columnDiffs[perm[col1 - 1]][perm[col1]];
										energyDiff += columnDiffs[perm[col1 - 1]][perm[col0]];
									}
									energyDiff += columnDiffs[perm[col0]][perm[col1]];
								} else {  // col1 > col0
									energyDiff += columnDiffs[perm[col1]][perm[col0]];
									if (col1 + 1 < width) {
										energyDiff -= columnDiffs[perm[col1]][perm[col1 + 1]];
										energyDiff += columnDiffs[perm[col0]][perm[col1 + 1]];
									}
								}
								// Accept the proposed change if energy improves or is within the simulated annealing probability
								if (energyDiff < 0 || Math.random() < Math.pow(2, -energyDiff / temperature)) {
									const temp: number = perm[col0];
									perm.splice(col0, 1);
									perm.splice(col1, 0, temp);
									curEnergy += energyDiff;
								}
							}
							curIteration++;
							if (Date.now() - startTime > YIELD_AFTER_TIME)
								break;
						}
						
						// Show image and statistics on screen periodically
						if (curIteration == numIterations || annealingLastDrawTime === null || Date.now() - annealingLastDrawTime > ANNEAL_REDRAW_TIME) {
							curIterationsElem.textContent = `${formatWithThousandsSeparators(curIteration)} (${(t*100).toFixed(2)}%)`;
							curTemperatureElem.textContent = temperature.toFixed(2);
							curEnergyElem.textContent = formatWithThousandsSeparators(curEnergy);
							let annealedImage: ImageData = graphics.createImageData(width, height);
							const shuffledPixels: Uint8ClampedArray = shuffledImage.data;
							let annealedPixels: Uint8ClampedArray = annealedImage.data;
							for (let y = 0; y < height; y++) {
								for (let x = 0; x < width; x++) {
									const off0: int = (y * width + perm[x]) * 4;
									const off1: int = (y * width + x) * 4;
									for (let i = 0; i < 4; i++)
										annealedPixels[off1 + i] = shuffledPixels[off0 + i];
								}
							}
							graphics.putImageData(annealedImage, 0, 0);
							annealingLastDrawTime = Date.now();
						}
						
						// Continue annealing or finish
						if (curIteration < numIterations)
							timeout = setTimeout(doAnneal);
						else
							setButtonsBusy(false);
					}
					
					
					function formatWithThousandsSeparators(n: int): string {
						let s: string = n.toString();
						for (let i = s.length - 3; i > 0; i -= 3)
							s = s.substring(0, i) + " " + s.substring(i);
						return s;
					}
				}
			}
		}
	}
	
}
