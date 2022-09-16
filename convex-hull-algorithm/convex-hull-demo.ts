/* 
 * Convex hull algorithm - Demo (TypeScript)
 * 
 * Copyright (c) 2022 Project Nayuki
 * https://www.nayuki.io/page/convex-hull-algorithm
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


// DOM elements
let svgElem = document.querySelector("article svg") as HTMLElement;
let staticRadio = document.getElementById("random-static"  ) as HTMLInputElement;
let movingRadio = document.getElementById("random-moving"  ) as HTMLInputElement;
let manualRadio = document.getElementById("manual-position") as HTMLInputElement;

// Constants and mutable state
const POINT_RADIUS: number = 0.012;
let points: Array<MovingPoint> = [];
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
					points.push(new MovingPoint(NaN, NaN, NaN, NaN));
				}
				points[draggingPointIndex] = new MovingPoint(evX, evY, 0, 0);
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
			points[draggingPointIndex] = new MovingPoint(evX, evY, 0, 0);
			if (type == "up")
				draggingPointIndex = -1;
		} else
			throw new Error("Assertion error");
		showPointsAndHull();
	}
}

window.addEventListener("DOMContentLoaded", initialize);


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
		const NUM_POINTS: number = Math.round(Math.pow(30, Math.random()) * 3);
		points = [];
		for (let i = 0; i < NUM_POINTS; i++)
			points.push(new MovingPoint(randomGaussian() * 0.17, randomGaussian() * 0.17, 0, 0));
		showPointsAndHull();
		timeout = window.setTimeout(start, 3000);
	}
	
	export function stop(): void {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}
	}
}


namespace movingDemo {
	let timeout: number|null = null;
	
	export function start(): void {
		const NUM_POINTS: number = 15;
		points = [];
		for (let i = 0; i < NUM_POINTS; i++)
			points.push(new MovingPoint(randomGaussian() * 0.05, randomGaussian() * 0.05, randomGaussian() * 0.10, randomGaussian() * 0.10));
		const time: number = performance.now();
		update(time, time);
	}
	
	function update(prevTime: number, curTime: number): void {
		showPointsAndHull();
		const deltaTime: number = Math.min(curTime - prevTime, 1000) / 1000;
		const bounds: DOMRect = svgElem.getBoundingClientRect()
		const width : number = bounds.width  / Math.min(bounds.width, bounds.height);
		const height: number = bounds.height / Math.min(bounds.width, bounds.height);
		for (let i = 0; i < points.length; i++) {
			let p: MovingPoint = points[i];
			p.x += p.vx * deltaTime;
			p.y += p.vy * deltaTime;
			if (Math.abs(p.x) > width / 2 || Math.abs(p.y) > height / 2)
				points[i] = new MovingPoint(randomGaussian() * 0.05, randomGaussian() * 0.05, randomGaussian() * 0.10, randomGaussian() * 0.10);
		}
		timeout = requestAnimationFrame(nextTime => update(curTime, nextTime));
	}
	
	export function stop(): void {
		if (timeout !== null) {
			cancelAnimationFrame(timeout);
			timeout = null;
		}
	}
}


function showPointsAndHull(): void {
	let onHullGroupElem : Element = svgElem.querySelectorAll("g")[1];
	let offHullGroupElem: Element = svgElem.querySelectorAll("g")[0];
	while (offHullGroupElem.firstChild !== null)
		offHullGroupElem.removeChild(offHullGroupElem.firstChild);
	while (onHullGroupElem.firstChild !== null)
		onHullGroupElem.removeChild(onHullGroupElem.firstChild);
	
	const hull: Array<MovingPoint> = convexhull.makeHull(points);
	let hullSet = new Set<MovingPoint>();
	for (const point of hull)
		hullSet.add(point);
	
	const s: string = hull.map((point, i) => `${i==0?"M":"L"}${point.x},${point.y}`).join("") + "Z";
	let pathElem = svgElem.querySelector("path") as Element;
	pathElem.setAttribute("d", s);
	
	for (const point of points) {
		let circElem: Element = document.createElementNS(svgElem.namespaceURI, "circle");
		circElem.setAttribute("cx", point.x.toString());
		circElem.setAttribute("cy", point.y.toString());
		circElem.setAttribute("r", POINT_RADIUS.toString());
		if (hullSet.has(point))
			onHullGroupElem.append(circElem);
		else
			offHullGroupElem.append(circElem);
	}
}


function randomGaussian(): number {
	return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(Math.random() * Math.PI * 2);
}


class MovingPoint implements Point {
	public constructor(
		public x: number,
		public y: number,
		public vx: number,
		public vy: number) {}
}
