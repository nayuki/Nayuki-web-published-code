/* 
 * Smallest enclosing circle - Demo (TypeScript)
 * 
 * Copyright (c) 2020 Project Nayuki
 * https://www.nayuki.io/page/smallest-enclosing-circle
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


// SVG DOM elements
let svgElem = document.querySelector("article svg") as HTMLElement;
let circleElem = svgElem.querySelector("circle") as Element;
let offCircleGroupElem: Element = svgElem.querySelectorAll("g")[0];
let onCircleGroupElem : Element = svgElem.querySelectorAll("g")[1];

// Radio button elements
let staticRadio = document.getElementById("random-static"  ) as HTMLInputElement;
let movingRadio = document.getElementById("random-moving"  ) as HTMLInputElement;
let manualRadio = document.getElementById("manual-position") as HTMLInputElement;

// Constants and mutable state
const POINT_RADIUS: number = 0.012;
let points: Array<{x:number,y:number,vx?:number,vy?:number}> = [];
let draggingPointIndex: number = -1;


function initialize(): void {
	handleRadioButtons();
	
	svgElem.onmousedown   = ev => handleMouse(ev, "down");
	svgElem.onmousemove   = ev => handleMouse(ev, "move");
	svgElem.onmouseup     = ev => handleMouse(ev, "up"  );
	svgElem.onselectstart = ev => ev.preventDefault();
	
	function handleMouse(ev: MouseEvent, type: "down"|"move"|"up"): void {
		// Calculate SVG coordinates
		const bounds: DOMRect = svgElem.getBoundingClientRect();
		const width : number = bounds.width  / Math.min(bounds.width, bounds.height);
		const height: number = bounds.height / Math.min(bounds.width, bounds.height);
		const evX: number = ((ev.clientX - bounds.left) / bounds.width  - 0.5) * width ;
		const evY: number = ((ev.clientY - bounds.top ) / bounds.height - 0.5) * height;
		
		if (type == "down") {
			// Find nearest existing point
			let nearestIndex: number = -1;
			let nearestDist: number = Infinity;
			points.forEach((point, index) => {
				const dist: number = Math.hypot(point.x - evX, point.y - evY);
				if (dist < nearestDist) {
					nearestDist = dist;
					nearestIndex = index;
				}
			});
			
			if (ev.button == 0) {
				if (nearestIndex != -1 && nearestDist < POINT_RADIUS * 1.5)
					draggingPointIndex = nearestIndex;
				else {
					draggingPointIndex = points.length;
					points.push({x: NaN, y: NaN});
				}
				points[draggingPointIndex] = {x: evX, y: evY};
			} else if (ev.button == 2) {
				if (nearestIndex != -1 && nearestDist < POINT_RADIUS * 1.5)
					points.splice(nearestIndex, 1);
				if (nearestDist < POINT_RADIUS * 5) {
					svgElem.oncontextmenu = ev => {
						ev.preventDefault();
						svgElem.oncontextmenu = null;
					};
				}
			} else
				return;
			manualRadio.checked = true;
			handleRadioButtons();
			
		} else if (type == "move" || type == "up") {
			if (draggingPointIndex == -1)
				return;
			points[draggingPointIndex] = {x: evX, y: evY};
			if (type == "up")
				draggingPointIndex = -1;
		} else
			throw "Assertion error";
		showPointsAndCircle();
	}
}


function handleRadioButtons(): void {
	staticDemo.stop();
	movingDemo.stop();
	if (staticRadio.checked)
		staticDemo.start();
	if (movingRadio.checked)
		movingDemo.start();
}


namespace staticDemo {
	let timeout: number|null = null;
	
	export function start(): void {
		const numPoints: number = Math.round(Math.pow(40, Math.random()) * 2);
		points = [];
		for (let i = 0; i < numPoints; i++) {
			points.push({
				x: randomGaussian() * 0.14,
				y: randomGaussian() * 0.14,
			});
		}
		showPointsAndCircle();
		timeout = window.setTimeout(staticDemo.start, 3000);
	}
	
	export function stop(): void {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	}
}


namespace movingDemo {
	let prevTime: number|null = null;
	let timeout: number|null = null;
	
	export function start(): void {
		const numPoints: number = 15;
		points = [];
		for (let i = 0; i < numPoints; i++) {
			points.push({
				x: randomGaussian() * 0.10,
				y: randomGaussian() * 0.10,
				vx: randomGaussian() * 0.04,
				vy: randomGaussian() * 0.04,
			});
		}
		prevTime = performance.now();
		update(prevTime);
	}
	
	function update(time: number): void {
		showPointsAndCircle();
		if (prevTime === null)
			throw "Assertion error";
		const dt: number = Math.min(time - prevTime, 1000) / 1000;
		const bounds: DOMRect = svgElem.getBoundingClientRect()
		const width : number = bounds.width  / Math.min(bounds.width, bounds.height);
		const height: number = bounds.height / Math.min(bounds.width, bounds.height);
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			if (p.vx === undefined || p.vy === undefined)
				throw "Assertion error";
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			if (Math.hypot(p.x, p.y) > 0.5) {
				points[i] = {
					x: randomGaussian() * 0.10,
					y: randomGaussian() * 0.10,
					vx: randomGaussian() * 0.04,
					vy: randomGaussian() * 0.04,
				};
			}
		}
		prevTime = time;
		timeout = requestAnimationFrame(update);
	}
	
	export function stop(): void {
		prevTime = null;
		if (timeout !== null) {
			cancelAnimationFrame(timeout);
			timeout = null;
		}
	}
}


function showPointsAndCircle(): void {
	while (offCircleGroupElem.firstChild !== null)
		offCircleGroupElem.removeChild(offCircleGroupElem.firstChild);
	while (onCircleGroupElem.firstChild !== null)
		onCircleGroupElem.removeChild(onCircleGroupElem.firstChild);
	
	let circle: Circle|null = makeCircle(points as Array<Point>);
	if (circle === null) {
		circleElem.setAttribute("r", "0");
		return;
	}
	circleElem.setAttribute("cx", circle.x.toString());
	circleElem.setAttribute("cy", circle.y.toString());
	circleElem.setAttribute("r", circle.r.toString());
	
	for (const point of points) {
		let circElem: Element = document.createElementNS(svgElem.namespaceURI, "circle");
		circElem.setAttribute("cx", point.x.toString());
		circElem.setAttribute("cy", point.y.toString());
		circElem.setAttribute("r", POINT_RADIUS.toString());
		const dist: number = Math.hypot(point.x - circle.x, point.y - circle.y) / circle.r;
		if (circle.r == 0 || 1 / MULTIPLICATIVE_EPSILON < dist && dist < MULTIPLICATIVE_EPSILON)
			onCircleGroupElem.appendChild(circElem);
		else
			offCircleGroupElem.appendChild(circElem);
	}
}


function randomGaussian(): number {
	return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(Math.random() * Math.PI * 2);
}


window.addEventListener("DOMContentLoaded", initialize);
