/* 
 * Animated floating graph nodes
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */

"use strict";


namespace config {
	export let idealNumNodes   : number = NaN;
	export let maxExtraEdges   : number = NaN;
	export let radiiWeightPower: number = NaN;
	export let driftSpeed      : number = NaN;
	export let repulsionForce  : number = NaN;
	export let borderFade      : number = -0.02;
	export let fadeInPerFrame  : number = 0.06;  // In the range (0.0, 1.0]
	export let fadeOutPerFrame : number = 0.03;  // In the range (0.0, 1.0]
	export let frameIntervalMs : number = 20;
}


/*---- Major functions ----*/

// Performs one-time initialization of the SVG image, the graph, and miscellaneous matters.
// Also responsible for holding the "global" state in the closure of the function,
// which are the 3 variables {nodes, edges, svgElem}.
function initialize(): void {
	let svgElem = document.querySelector("article svg") as Element;
	let relWidth : number;
	let relHeight: number;
	{
		let boundRect = svgElem.getBoundingClientRect();
		relWidth  = boundRect.width  / Math.max(boundRect.width, boundRect.height);
		relHeight = boundRect.height / Math.max(boundRect.width, boundRect.height);
	}
	svgElem.setAttribute("viewBox", "0 0 " + relWidth + " " + relHeight);
	{
		let rectElem = svgElem.querySelector("rect") as Element;
		rectElem.setAttribute("width" , relWidth .toString());
		rectElem.setAttribute("height", relHeight.toString());
	}
	svgElem.querySelectorAll("stop")[0].setAttribute("stop-color", "#575E85");
	svgElem.querySelectorAll("stop")[1].setAttribute("stop-color", "#2E3145");
	
	initInputHandlers();
	
	let nodes: Array<GNode> = [];
	let edges: Array<GEdge> = [];
	
	// This important top-level function updates the arrays of nodes and edges, then redraws the SVG image.
	// We define it within the closure to give it access to key variables that persist across iterations.
	function stepFrame(): void {
		nodes = updateNodes(relWidth, relHeight, nodes);
		edges = updateEdges(nodes, edges);
		redrawOutput(svgElem, nodes, edges);
	}
	
	// Populate initial nodes and edges, then improve on them
	stepFrame();  // Generate nodes
	for (let i = 0; i < 300; i++)  // Spread out nodes to avoid ugly clumping
		doForceField(nodes);
	edges = [];
	stepFrame();  // Redo spanning tree and extra edges because nodes have moved
	
	// Make everything render immediately instead of fading in
	for (let node of nodes)
		node.opacity = 1;
	for (let edge of edges)
		edge.opacity = 1;
	redrawOutput(svgElem, nodes, edges);
	
	// Periodically execute stepFrame() to create animation
	setInterval(stepFrame, config.frameIntervalMs);
}


// Sets event handlers for form input elements, and sets global configuration variables.
function initInputHandlers() {
	function setAndCall(elemId: string, func: (val: number) => void) {
		let handler: () => void;
		let elem = document.getElementById(elemId);
		if (elem instanceof HTMLInputElement) {
			handler = () => func(parseFloat((elem as HTMLInputElement).value));
			elem.oninput = handler;
		} else if (elem instanceof HTMLSelectElement) {
			handler = () => func(parseFloat((elem as HTMLSelectElement).value));
			elem.onchange = handler;
		} else
			throw "Assertion error";
		handler();
	}
	
	setAndCall("number-nodes", val =>
		config.idealNumNodes = Math.round(val));
	setAndCall("extra-edges", val =>
		config.maxExtraEdges = Math.round(val / 100 * config.idealNumNodes));
	setAndCall("network-style", val =>
		config.radiiWeightPower = val);
	setAndCall("drift-speed", val => {
		if (!isNaN(val))
			config.driftSpeed = val * 0.0001;
	});
	setAndCall("repulsion-force", val => {
		if (!isNaN(val))
			config.repulsionForce = val * 0.000001;
	});
}


// Returns a new array of nodes by updating/adding/removing nodes based on the given array. Although the
// argument array is not modified, the node objects themselves are modified. No other side effects.
// The aspect ratio relWidth:relHeight is equal to w:h.
function updateNodes(relWidth: number, relHeight: number, nodes: Array<GNode>): Array<GNode> {
	if (relWidth < 0 || relWidth > 1 || relHeight < 0 || relHeight > 1 || relWidth != 1 && relHeight != 1)
		throw "Assertion error";
	
	// Update position, velocity, opacity; prune faded nodes
	let newNodes: Array<GNode> = [];
	for (let node of nodes) {
		// Move based on velocity
		node.posX += node.velX * config.driftSpeed;
		node.posY += node.velY * config.driftSpeed;
		// Randomly perturb velocity, with damping
		node.velX = node.velX * 0.99 + (Math.random() - 0.5) * 0.3;
		node.velY = node.velY * 0.99 + (Math.random() - 0.5) * 0.3;
		
		// Fade out nodes near the borders of the space or exceeding the target number of nodes
		let border: number = config.borderFade;
		let interior: boolean = border < node.posX && node.posX < relWidth - border &&
				border < node.posY && node.posY < relHeight - border;
		node.fade(newNodes.length < config.idealNumNodes && interior);
		// Only keep visible nodes
		if (node.opacity > 0)
			newNodes.push(node);
	}
	
	// Add new nodes to fade in
	while (newNodes.length < config.idealNumNodes) {
		newNodes.push(new GNode(
			Math.random() * relWidth, Math.random() * relHeight,  // Position X and Y
			(Math.pow(Math.random(), 5) + 0.35) * 0.015,  // Radius skewing toward smaller values
			0.0, 0.0));  // Velocity
	}
	
	// Spread out nodes a bit
	doForceField(newNodes);
	return newNodes;
}


// Updates the position of each node in the given array (in place), based on
// their existing positions. Returns nothing. No other side effects.
function doForceField(nodes: Array<GNode>): void {
	// For simplicitly, we perturb positions directly, instead of velocities
	for (let i = 0; i < nodes.length; i++) {
		let a: GNode = nodes[i];
		a.dPosX = 0;
		a.dPosY = 0;
		for (let j = 0; j < i; j++) {
			let b: GNode = nodes[j];
			let dx: number = a.posX - b.posX;
			let dy: number = a.posY - b.posY;
			let distSqr: number = dx * dx + dy * dy;
			// Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
			// 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
			let factor: number = config.repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
			dx *= factor;
			dy *= factor;
			a.dPosX += dx;
			a.dPosY += dy;
			b.dPosX -= dx;
			b.dPosY -= dy;
		}
	}
	for (let node of nodes) {
		node.posX += node.dPosX;
		node.posY += node.dPosY;
	}
}


// Returns a new array of edges by reading the given array of nodes and by updating/adding/removing edges
// based on the other given array. Although both argument arrays and nodes are unmodified,
// the edge objects themselves are modified. No other side effects.
function updateEdges(nodes: Array<GNode>, edges: Array<GEdge>): Array<GEdge> {
	// Calculate array of spanning tree edges, then add some extra low-weight edges
	let allEdges: Array<[number,number,number]> = calcAllEdgeWeights(nodes);
	let idealEdges: Array<GEdge> = calcSpanningTree(allEdges, nodes);
	for (let [_, i, j] of allEdges) {
		if (idealEdges.length >= nodes.length - 1 + config.maxExtraEdges)
			break;
		let edge = new GEdge(nodes[i], nodes[j]);  // Convert data formats
		if (!containsEdge(idealEdges, edge))
			idealEdges.push(edge);
	}
	
	// Classify each current edge, checking whether it is in the ideal set; prune faded edges
	let newEdges: Array<GEdge> = [];
	for (let edge of edges) {
		edge.fade(containsEdge(idealEdges, edge));
		if (edge.opacity > 0 && edge.nodeA.opacity > 0 && edge.nodeB.opacity > 0)
			newEdges.push(edge);
	}
	
	// If there is room for new edges, add some missing spanning tree edges (higher priority), then extra edges
	for (let edge of idealEdges) {
		if (newEdges.length >= nodes.length - 1 + config.maxExtraEdges)
			break;
		if (!containsEdge(newEdges, edge))
			newEdges.push(edge);
	}
	return newEdges;
}


// Redraws the SVG image based on the given values. No other side effects.
function redrawOutput(svgElem: Element, nodes: Array<GNode>, edges: Array<GEdge>): void {
	// Clear movable objects
	let gElem = svgElem.querySelector("g") as Element;
	while (gElem.firstChild != null)
		gElem.removeChild(gElem.firstChild);
	
	function createSvgElem(tag: string, attribs: any): Element {
		let result = document.createElementNS(svgElem.namespaceURI, tag);
		for (let key in attribs)
			result.setAttribute(key, attribs[key].toString());
		return result;
	}
	
	// Draw every node
	for (let node of nodes) {
		gElem.appendChild(createSvgElem("circle", {
			"cx": node.posX,
			"cy": node.posY,
			"r": node.radius,
			"fill": "rgba(129,139,197," + node.opacity.toFixed(3) + ")",
		}));
	}
	
	// Draw every edge
	for (let edge of edges) {
		let a: GNode = edge.nodeA;
		let b: GNode = edge.nodeB;
		let dx: number = a.posX - b.posX;
		let dy: number = a.posY - b.posY;
		let mag: number = Math.hypot(dx, dy);
		if (mag > a.radius + b.radius) {  // Draw edge only if circles don't intersect
			dx /= mag;  // Make (dx, dy) a unit vector, pointing from B to A
			dy /= mag;
			let opacity: number = Math.min(Math.min(a.opacity, b.opacity), edge.opacity);
			gElem.appendChild(createSvgElem("line", {
				// Shorten the edge so that it only touches the circumference of each circle
				"x1": a.posX - dx * a.radius,
				"y1": a.posY - dy * a.radius,
				"x2": b.posX + dx * b.radius,
				"y2": b.posY + dy * b.radius,
				"stroke": "rgba(129,139,197," + opacity.toFixed(3) + ")",
			}));
		}
	}
}


/*---- Minor functions ----*/

// Returns a sorted array of edges with weights, for all unique edge pairs. Pure function, no side effects.
function calcAllEdgeWeights(nodes: Array<GNode>): Array<[number,number,number]> {
	// Each entry has the form [weight, nodeAIndex, nodeBIndex], where nodeAIndex < nodeBIndex
	let result: Array<[number,number,number]> = [];
	for (let i = 0; i < nodes.length; i++) {  // Calculate all n * (n - 1) / 2 edges
		let a: GNode = nodes[i];
		for (let j = 0; j < i; j++) {
			let b: GNode = nodes[j];
			let weight: number = Math.hypot(a.posX - b.posX, a.posY - b.posY);  // Euclidean distance
			weight /= Math.pow(a.radius * b.radius, config.radiiWeightPower);  // Give discount based on node radii
			result.push([weight, i, j]);
		}
	}
	
	// Sort array by ascending weight
	result.sort((a, b) => a[0] - b[0]);
	return result;
}


// Returns a new array of edge objects that is a minimal spanning tree on the given set
// of nodes, with edges in ascending order of weight. Pure function, no side effects.
function calcSpanningTree(allEdges: Array<[number,number,number]>, nodes: Array<GNode>): Array<GEdge> {
	// Kruskal's MST algorithm
	let result: Array<GEdge> = [];
	let ds = new DisjointSet(nodes.length);
	for (let [_, i, j] of allEdges) {
		if (result.length >= nodes.length - 1)
			break;
		if (ds.mergeSets(i, j))
			result.push(new GEdge(nodes[i], nodes[j]));  // Convert data formats
	}
	return result;
}


// Tests whether the given array of edge objects contains an edge with
// the given endpoints (undirected). Pure function, no side effects.
function containsEdge(array: Array<GEdge>, edge: GEdge): boolean {
	for (let e of array) {
		if (e.nodeA == edge.nodeA && e.nodeB == edge.nodeB ||
		    e.nodeA == edge.nodeB && e.nodeB == edge.nodeA)
			return true;
	}
	return false;
}



/*---- Graph object classes ----*/

class GObject {
	public opacity: number = 0.0;
	
	public fade(fadeIn: boolean): void {
		this.opacity = fadeIn ?
			Math.min(this.opacity + config.fadeInPerFrame , 1.0) :
			Math.max(this.opacity - config.fadeOutPerFrame, 0.0);
	}
}


class GNode extends GObject {
	public dPosX: number = 0;
	public dPosY: number = 0;
	
	public constructor(
			public posX: number,  // Horizontal position in relative coordinates, typically in the range [0.0, relWidth], where relWidth <= 1.0
			public posY: number,  // Vertical position in relative coordinates, typically in the range [0.0, relHeight], where relHeight <= 1.0
			public radius: number,  // Radius of the node, a positive real number
			public velX: number,  // Horizontal velocity in relative units (not pixels)
			public velY: number) {  // Vertical velocity in relative units (not pixels)
		super();
	}
}


class GEdge extends GObject {
	public constructor(
			public nodeA: GNode,  // A reference to the node object representing one side of the undirected edge
			public nodeB: GNode) {  // A reference to the node object representing another side of the undirected edge (must be distinct from NodeA)
		super();
	}
}



/*---- Union-find data structure ----*/

// A heavily stripped down version of the code originally from
// https://www.nayuki.io/page/disjoint-set-data-structure .
class DisjointSet {
	public parents: Array<number> = [];
	public ranks  : Array<number> = [];
	
	public constructor(size: number) {
		for (let i = 0; i < size; i++) {
			this.parents.push(i);
			this.ranks.push(0);
		}
	}
	
	public mergeSets(i: number, j: number): boolean {
		let repr0: number = this.getRepr(i);
		let repr1: number = this.getRepr(j);
		if (repr0 == repr1)
			return false;
		let cmp: number = this.ranks[repr0] - this.ranks[repr1];
		if (cmp >= 0) {
			if (cmp == 0)
				this.ranks[repr0]++;
			this.parents[repr1] = repr0;
		} else
			this.parents[repr0] = repr1;
		return true;
	}
	
	private getRepr(i: number): number {
		if (this.parents[i] != i)
			this.parents[i] = this.getRepr(this.parents[i]);
		return this.parents[i];
	}
}



/*---- Initialization ----*/

if (!("hypot" in Math)) {  // Polyfill
	(Math as any).hypot = (x: number, y: number) =>
		(Math as any).sqrt(x * x + y * y);
}


initialize();
