/* 
 * Animated floating graph nodes
 * 
 * Copyright (c) 2018 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */

"use strict";


namespace app {
	
	function main(): void {
		// Initialize the graph, form inputs, SVG output
		let graph = new SvgGraph();
		initInputHandlers(graph);
		let svg = document.querySelector("article svg") as Element;
		graph.setOutput(svg).initSvgGraph();
		
		// Periodically update graph to create animation
		const frameIntervalMs = 20;
		setInterval(() => {
			graph.stepFrame();
			graph.redrawOutput();
		}, frameIntervalMs);
	}
	
	
	// Sets event handlers for form input elements, and sets configuration variables.
	function initInputHandlers(graph: Graph) {
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
			graph.idealNumNodes = Math.round(val));
		setAndCall("extra-edges", val =>
			graph.maxExtraEdges = Math.round(val / 100 * graph.idealNumNodes));
		setAndCall("network-style", val =>
			graph.radiiWeightPower = val);
		setAndCall("drift-speed", val => {
			if (!isNaN(val))
				graph.driftSpeed = val * 0.0001;
		});
		setAndCall("repulsion-force", val => {
			if (!isNaN(val))
				graph.repulsionForce = val * 0.000001;
		});
	}
	
	
	
	/*---- Major graph classes ----*/
	
	class Graph {
		
		// Configuration
		public idealNumNodes   : number = NaN;
		public maxExtraEdges   : number = NaN;
		public radiiWeightPower: number = NaN;
		public driftSpeed      : number = NaN;
		public repulsionForce  : number = NaN;
		public borderFade      : number = -0.02;
		public fadeInPerFrame  : number = 0.06;  // In the range (0.0, 1.0]
		public fadeOutPerFrame : number = -0.03;  // In the range [-1.0, 0.0)
		
		// State
		protected relWidth : number = NaN;
		protected relHeight: number = NaN;
		protected nodes: Array<GNode> = [];
		protected edges: Array<GEdge> = [];
		
		
		public setDimensions(rw: number, rh: number): Graph {
			if (rw < 0 || rw > 1 || rh < 0 || rh > 1 || rw != 1 && rh != 1)
				throw "Assertion error";
			this.relWidth  = rw;
			this.relHeight = rh;
			return this;
		}
		
		
		public initGraph(): void {
			// Generate initial nodes
			this.nodes = [];
			this.updateNodes();
			
			// Spread out nodes to avoid ugly clumping
			for (let i = 0; i < 300; i++)
				this.doForceField();
			
			// Generate spanning tree of edges
			this.edges = [];
			this.updateEdges();
			
			// Make everything render immediately instead of fading in
			for (let node of this.nodes)
				node.opacity = 1;
			for (let edge of this.edges)
				edge.opacity = 1;
		}
		
		
		public stepFrame(): void {
			this.updateNodes();
			this.updateEdges();
		}
		
		
		// Updates, adds, and remove nodes according to the animation rules.
		private updateNodes(): void {
			// Update each node's position, velocity, opacity. Remove fully transparent nodes.
			let newNodes: Array<GNode> = [];
			for (let node of this.nodes) {
				// Move based on velocity
				node.posX += node.velX * this.driftSpeed;
				node.posY += node.velY * this.driftSpeed;
				// Randomly perturb velocity, with damping
				node.velX = node.velX * 0.99 + (Math.random() - 0.5) * 0.3;
				node.velY = node.velY * 0.99 + (Math.random() - 0.5) * 0.3;
				
				// Fade out nodes near the borders of the rectangle, or exceeding the target number of nodes
				let insideness = Math.min(node.posX, this.relWidth - node.posX,
					node.posY, this.relHeight - node.posY);
				node.fade(newNodes.length < this.idealNumNodes && insideness > this.borderFade ?
					this.fadeInPerFrame : this.fadeOutPerFrame);
				// Only keep visible nodes
				if (node.opacity > 0)
					newNodes.push(node);
			}
			
			// Add new nodes to fade in
			while (newNodes.length < this.idealNumNodes) {
				newNodes.push(new GNode(
					Math.random() * this.relWidth, Math.random() * this.relHeight,  // Position X and Y
					(Math.pow(Math.random(), 5) + 0.35) * 0.015,  // Radius skewing toward smaller values
					0.0, 0.0));  // Velocity
			}
			
			// Spread out nodes a bit
			this.nodes = newNodes;
			this.doForceField();
		}
		
		
		// Updates the position of each node in place, based on their existing
		// positions. Doesn't change velocity, opacity, edges, or anything else.
		private doForceField(): void {
			// For aesthetics, we perturb positions instead of velocities
			for (let i = 0; i < this.nodes.length; i++) {
				let a: GNode = this.nodes[i];
				a.dPosX = 0;
				a.dPosY = 0;
				for (let j = 0; j < i; j++) {
					let b: GNode = this.nodes[j];
					let dx: number = a.posX - b.posX;
					let dy: number = a.posY - b.posY;
					let distSqr: number = dx * dx + dy * dy;
					// Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
					// 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
					let factor: number = this.repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
					dx *= factor;
					dy *= factor;
					a.dPosX += dx;
					a.dPosY += dy;
					b.dPosX -= dx;
					b.dPosY -= dy;
				}
			}
			for (let node of this.nodes) {
				node.posX += node.dPosX;
				node.posY += node.dPosY;
			}
		}
		
		
		// Updates, adds, and remove edges according to the animation rules.
		private updateEdges(): void {
			// Calculate array of spanning tree edges, then add some extra low-weight edges
			let allEdges: Array<[number,number,number]> = this.calcAllEdgeWeights();
			let idealEdges: Array<GEdge> = this.calcSpanningTree(allEdges);
			for (let [_, i, j] of allEdges) {
				if (idealEdges.length >= this.nodes.length - 1 + this.maxExtraEdges)
					break;
				let edge = new GEdge(this.nodes[i], this.nodes[j]);  // Convert data formats
				if (!Graph.containsEdge(idealEdges, edge))
					idealEdges.push(edge);
			}
			
			// Classify each current edge, checking whether it is in the ideal set; prune faded edges
			let newEdges: Array<GEdge> = [];
			for (let edge of this.edges) {
				edge.fade(Graph.containsEdge(idealEdges, edge) ?
					this.fadeInPerFrame : this.fadeOutPerFrame);
				if (Math.min(edge.opacity, edge.nodeA.opacity, edge.nodeB.opacity) > 0)
					newEdges.push(edge);
			}
			
			// If there's room for new edges, add some missing spanning tree edges (higher priority), then extra edges
			for (let edge of idealEdges) {
				if (newEdges.length >= this.nodes.length - 1 + this.maxExtraEdges)
					break;
				if (!Graph.containsEdge(newEdges, edge))
					newEdges.push(edge);
			}
			this.edges = newEdges;
		}
		
		
		// Returns a sorted array of edges with weights, for all unique edge pairs. Pure function, no side effects.
		private calcAllEdgeWeights(): Array<[number,number,number]> {
			// Each entry has the form [weight,nodeAIndex,nodeBIndex], where nodeAIndex < nodeBIndex
			let result: Array<[number,number,number]> = [];
			for (let i = 0; i < this.nodes.length; i++) {  // Calculate all n * (n - 1) / 2 edges
				let a: GNode = this.nodes[i];
				for (let j = 0; j < i; j++) {
					let b: GNode = this.nodes[j];
					let weight: number = Math.hypot(a.posX - b.posX, a.posY - b.posY);  // Euclidean distance
					weight /= Math.pow(a.radius * b.radius, this.radiiWeightPower);  // Give discount based on node radii
					result.push([weight, i, j]);
				}
			}
			return result.sort((a, b) => a[0] - b[0]);  // Sort by ascending weight
		}
		
		
		// Returns a new array of edge objects that is a minimal spanning tree on the given set
		// of nodes, with edges in ascending order of weight. Pure function, no side effects.
		private calcSpanningTree(allEdges: Array<[number,number,number]>): Array<GEdge> {
			// Kruskal's MST algorithm
			let result: Array<GEdge> = [];
			let ds = new DisjointSet(this.nodes.length);
			for (let [_, i, j] of allEdges) {
				if (ds.mergeSets(i, j)) {
					result.push(new GEdge(this.nodes[i], this.nodes[j]));  // Convert data formats
					if (result.length >= this.nodes.length - 1)
						break;
				}
			}
			return result;
		}
		
		
		// Tests whether the given array of edge objects contains an edge with
		// the given endpoints (undirected). Pure function, no side effects.
		private static containsEdge(edges: Array<GEdge>, edge: GEdge): boolean {
			for (let e of edges) {
				if (e.nodeA == edge.nodeA && e.nodeB == edge.nodeB ||
				    e.nodeA == edge.nodeB && e.nodeB == edge.nodeA)
					return true;
			}
			return false;
		}
		
	}
	
	
	
	class SvgGraph extends Graph {
		
		private svgElem: Element|null = null;
		
		
		public setOutput(svg: Element): SvgGraph {
			let br = svg.getBoundingClientRect();
			this.setDimensions(
				br.width  / Math.max(br.width, br.height),
				br.height / Math.max(br.width, br.height));
			
			this.svgElem = svg;
			svg.setAttribute("viewBox", `0 0 ${this.relWidth} ${this.relHeight}`);
			let rectElem = svg.querySelector("rect") as Element;
			svg.setAttribute("width" , this.relWidth .toString());
			svg.setAttribute("height", this.relHeight.toString());
			svg.querySelectorAll("stop")[0].setAttribute("stop-color", "#575E85");
			svg.querySelectorAll("stop")[1].setAttribute("stop-color", "#2E3145");
			return this;
		}
		
		
		public initSvgGraph(): void {
			this.initGraph();
			this.redrawOutput();
		}
		
		
		public redrawOutput(): void {
			if (this.svgElem === null)
				throw "Invalid state";
			let svg = this.svgElem as Element;
			
			// Clear movable objects
			let gElem = svg.querySelector("g") as Element;
			while (gElem.firstChild != null)
				gElem.removeChild(gElem.firstChild);
			
			function createSvgElem(tag: string, attribs: any): Element {
				let result = document.createElementNS(svg.namespaceURI, tag);
				for (let key in attribs)
					result.setAttribute(key, attribs[key].toString());
				return result;
			}
			
			// Draw every node
			for (let node of this.nodes) {
				gElem.appendChild(createSvgElem("circle", {
					"cx": node.posX,
					"cy": node.posY,
					"r": node.radius,
					"fill": "rgba(129,139,197," + node.opacity.toFixed(3) + ")",
				}));
			}
			
			// Draw every edge
			for (let edge of this.edges) {
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
		
	}
	
	
	
	/*---- Minor graph object classes ----*/
	
	class GObject {
		public opacity: number = 0.0;
		
		public fade(delta: number): void {
			this.opacity = Math.max(Math.min(this.opacity + delta, 1.0), 0.0);
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
		private parents: Array<number> = [];
		private ranks  : Array<number> = [];
		
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
	
	main();
}
