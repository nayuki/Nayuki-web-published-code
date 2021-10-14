/*
 * Animated floating graph nodes (compiled from TypeScript)
 *
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/animated-floating-graph-nodes
 */
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var app;
(function (app) {
    function main() {
        // Initialize the graph, form inputs, SVG output
        var graph = new SvgGraph();
        initInputHandlers(graph);
        var svg = document.querySelector("article svg");
        graph.setOutput(svg).initSvgGraph();
        // Periodically update graph to create animation
        var frameIntervalMs = 20;
        setInterval(function () {
            graph.stepFrame();
            graph.redrawOutput();
        }, frameIntervalMs);
    }
    // Sets event handlers for form input elements, and sets configuration variables.
    function initInputHandlers(graph) {
        function setAndCall(elemId, func) {
            var handler;
            var elem = document.getElementById(elemId);
            if (elem instanceof HTMLInputElement) {
                handler = function () { return func(parseFloat(elem.value)); };
                elem.oninput = handler;
            }
            else if (elem instanceof HTMLSelectElement) {
                handler = function () { return func(parseFloat(elem.value)); };
                elem.onchange = handler;
            }
            else
                throw "Assertion error";
            handler();
        }
        setAndCall("number-nodes", function (val) {
            return graph.idealNumNodes = Math.round(val);
        });
        setAndCall("extra-edges", function (val) {
            return graph.extraEdgeProportion = val / 100;
        });
        setAndCall("network-style", function (val) {
            return graph.radiiWeightPower = val;
        });
        setAndCall("drift-speed", function (val) {
            if (!isNaN(val))
                graph.driftSpeed = val * 0.0001;
        });
        setAndCall("repulsion-force", function (val) {
            if (!isNaN(val))
                graph.repulsionForce = val * 0.000001;
        });
    }
    /*---- Major graph classes ----*/
    var Graph = /** @class */ (function () {
        function Graph() {
            // Configuration
            this.idealNumNodes = NaN;
            this.extraEdgeProportion = NaN;
            this.radiiWeightPower = NaN;
            this.driftSpeed = NaN;
            this.repulsionForce = NaN;
            this.borderFade = -0.02;
            this.fadeInPerFrame = 0.06; // In the range (0.0, 1.0]
            this.fadeOutPerFrame = -0.03; // In the range [-1.0, 0.0)
            // State
            this.relWidth = NaN;
            this.relHeight = NaN;
            this.frameNumber = NaN;
            this.nodes = [];
            this.edges = [];
        }
        Graph.prototype.setDimensions = function (rw, rh) {
            if (rw < 0 || rw > 1 || rh < 0 || rh > 1 || rw != 1 && rh != 1)
                throw "Assertion error";
            this.relWidth = rw;
            this.relHeight = rh;
            return this;
        };
        Graph.prototype.initGraph = function () {
            this.nodes = [];
            this.edges = [];
            this.frameNumber = 0;
        };
        Graph.prototype.stepFrame = function () {
            this.updateNodes();
            this.updateEdges();
            this.frameNumber++;
        };
        // Updates, adds, and remove nodes according to the animation rules.
        Graph.prototype.updateNodes = function () {
            // Update each node's position, velocity, opacity. Remove fully transparent nodes.
            var newNodes = [];
            var curIdealNumNodes = Math.min(Math.floor(this.frameNumber / 3), this.idealNumNodes);
            for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
                var node = _a[_i];
                // Move based on velocity
                node.posX += node.velX * this.driftSpeed;
                node.posY += node.velY * this.driftSpeed;
                // Randomly perturb velocity, with damping
                node.velX = node.velX * 0.99 + (Math.random() - 0.5) * 0.3;
                node.velY = node.velY * 0.99 + (Math.random() - 0.5) * 0.3;
                // Fade out nodes near the borders of the rectangle, or exceeding the target number of nodes
                var insideness = Math.min(node.posX, this.relWidth - node.posX, node.posY, this.relHeight - node.posY);
                node.fade(newNodes.length < curIdealNumNodes && insideness > this.borderFade ?
                    this.fadeInPerFrame : this.fadeOutPerFrame);
                // Only keep visible nodes
                if (node.opacity > 0)
                    newNodes.push(node);
            }
            // Add new nodes to fade in
            while (newNodes.length < curIdealNumNodes) {
                newNodes.push(new GNode(Math.random() * this.relWidth, Math.random() * this.relHeight, // Position X and Y
                (Math.pow(Math.random(), 5) + 0.35) * 0.015, // Radius skewing toward smaller values
                0.0, 0.0)); // Velocity
            }
            // Spread out nodes a bit
            this.nodes = newNodes;
            this.doForceField();
        };
        // Updates the position of each node in place, based on their existing
        // positions. Doesn't change velocity, opacity, edges, or anything else.
        Graph.prototype.doForceField = function () {
            // For aesthetics, we perturb positions instead of velocities
            for (var i = 0; i < this.nodes.length; i++) {
                var a = this.nodes[i];
                a.dPosX = 0;
                a.dPosY = 0;
                for (var j = 0; j < i; j++) {
                    var b = this.nodes[j];
                    var dx = a.posX - b.posX;
                    var dy = a.posY - b.posY;
                    var distSqr = dx * dx + dy * dy;
                    // Notes: The factor 1/sqrt(distSqr) is to make (dx, dy) into a unit vector.
                    // 1/distSqr is the inverse square law, with a smoothing constant added to prevent singularity.
                    var factor = this.repulsionForce / (Math.sqrt(distSqr) * (distSqr + 0.00001));
                    dx *= factor;
                    dy *= factor;
                    a.dPosX += dx;
                    a.dPosY += dy;
                    b.dPosX -= dx;
                    b.dPosY -= dy;
                }
            }
            for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
                var node = _a[_i];
                node.posX += node.dPosX;
                node.posY += node.dPosY;
            }
        };
        // Updates, adds, and remove edges according to the animation rules.
        Graph.prototype.updateEdges = function () {
            // Calculate array of spanning tree edges, then add some extra low-weight edges
            var allEdges = this.calcAllEdgeWeights();
            var idealNumEdges = Math.round((this.nodes.length - 1) * (1 + this.extraEdgeProportion));
            var idealEdges = this.calcSpanningTree(allEdges);
            for (var _i = 0, allEdges_1 = allEdges; _i < allEdges_1.length; _i++) {
                var _a = allEdges_1[_i], _ = _a[0], i = _a[1], j = _a[2];
                if (idealEdges.length >= idealNumEdges)
                    break;
                var edge = new GEdge(this.nodes[i], this.nodes[j]); // Convert data formats
                if (!Graph.containsEdge(idealEdges, edge))
                    idealEdges.push(edge);
            }
            // Classify each current edge, checking whether it is in the ideal set; prune faded edges
            var newEdges = [];
            for (var _b = 0, _c = this.edges; _b < _c.length; _b++) {
                var edge = _c[_b];
                edge.fade(Graph.containsEdge(idealEdges, edge) ?
                    this.fadeInPerFrame : this.fadeOutPerFrame);
                if (Math.min(edge.opacity, edge.nodeA.opacity, edge.nodeB.opacity) > 0)
                    newEdges.push(edge);
            }
            // If there's room for new edges, add some missing spanning tree edges (higher priority), then extra edges
            for (var _d = 0, idealEdges_1 = idealEdges; _d < idealEdges_1.length; _d++) {
                var edge = idealEdges_1[_d];
                if (newEdges.length >= idealNumEdges)
                    break;
                if (!Graph.containsEdge(newEdges, edge))
                    newEdges.push(edge);
            }
            this.edges = newEdges;
        };
        // Returns a sorted array of edges with weights, for all unique edge pairs. Pure function, no side effects.
        Graph.prototype.calcAllEdgeWeights = function () {
            // Each entry has the form [weight,nodeAIndex,nodeBIndex], where nodeAIndex < nodeBIndex
            var result = [];
            for (var i = 0; i < this.nodes.length; i++) { // Calculate all n * (n - 1) / 2 edges
                var a = this.nodes[i];
                for (var j = 0; j < i; j++) {
                    var b = this.nodes[j];
                    var weight = Math.hypot(a.posX - b.posX, a.posY - b.posY); // Euclidean distance
                    weight /= Math.pow(a.radius * b.radius, this.radiiWeightPower); // Give discount based on node radii
                    result.push([weight, i, j]);
                }
            }
            return result.sort(function (a, b) { return a[0] - b[0]; }); // Sort by ascending weight
        };
        // Returns a new array of edge objects that is a minimal spanning tree on the given set
        // of nodes, with edges in ascending order of weight. Pure function, no side effects.
        Graph.prototype.calcSpanningTree = function (allEdges) {
            // Kruskal's MST algorithm
            var result = [];
            var ds = new DisjointSet(this.nodes.length);
            for (var _i = 0, allEdges_2 = allEdges; _i < allEdges_2.length; _i++) {
                var _a = allEdges_2[_i], _ = _a[0], i = _a[1], j = _a[2];
                if (ds.mergeSets(i, j)) {
                    result.push(new GEdge(this.nodes[i], this.nodes[j])); // Convert data formats
                    if (result.length >= this.nodes.length - 1)
                        break;
                }
            }
            return result;
        };
        // Tests whether the given array of edge objects contains an edge with
        // the given endpoints (undirected). Pure function, no side effects.
        Graph.containsEdge = function (edges, edge) {
            for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
                var e = edges_1[_i];
                if (e.nodeA == edge.nodeA && e.nodeB == edge.nodeB ||
                    e.nodeA == edge.nodeB && e.nodeB == edge.nodeA)
                    return true;
            }
            return false;
        };
        return Graph;
    }());
    var SvgGraph = /** @class */ (function (_super) {
        __extends(SvgGraph, _super);
        function SvgGraph() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.svgElem = null;
            return _this;
        }
        SvgGraph.prototype.setOutput = function (svg) {
            var br = svg.getBoundingClientRect();
            this.setDimensions(br.width / Math.max(br.width, br.height), br.height / Math.max(br.width, br.height));
            this.svgElem = svg;
            svg.setAttribute("viewBox", "0 0 " + this.relWidth + " " + this.relHeight);
            var rectElem = svg.querySelector("rect");
            svg.setAttribute("width", this.relWidth.toString());
            svg.setAttribute("height", this.relHeight.toString());
            svg.querySelectorAll("stop")[0].setAttribute("stop-color", "#575E85");
            svg.querySelectorAll("stop")[1].setAttribute("stop-color", "#2E3145");
            return this;
        };
        SvgGraph.prototype.initSvgGraph = function () {
            this.initGraph();
            this.redrawOutput();
        };
        SvgGraph.prototype.redrawOutput = function () {
            if (this.svgElem === null)
                throw "Invalid state";
            var svg = this.svgElem;
            // Clear movable objects
            var gElem = svg.querySelector("g");
            while (gElem.firstChild !== null)
                gElem.removeChild(gElem.firstChild);
            function createSvgElem(tag, attribs) {
                var result = document.createElementNS(svg.namespaceURI, tag);
                for (var key in attribs)
                    result.setAttribute(key, attribs[key].toString());
                return result;
            }
            // Draw every node
            for (var _i = 0, _a = this.nodes; _i < _a.length; _i++) {
                var node = _a[_i];
                gElem.appendChild(createSvgElem("circle", {
                    "cx": node.posX,
                    "cy": node.posY,
                    "r": node.radius,
                    "fill": "rgba(129,139,197," + node.opacity.toFixed(3) + ")",
                }));
            }
            // Draw every edge
            for (var _b = 0, _c = this.edges; _b < _c.length; _b++) {
                var edge = _c[_b];
                var a = edge.nodeA;
                var b = edge.nodeB;
                var dx = a.posX - b.posX;
                var dy = a.posY - b.posY;
                var mag = Math.hypot(dx, dy);
                if (mag > a.radius + b.radius) { // Draw edge only if circles don't intersect
                    dx /= mag; // Make (dx, dy) a unit vector, pointing from B to A
                    dy /= mag;
                    var opacity = Math.min(Math.min(a.opacity, b.opacity), edge.opacity);
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
        };
        return SvgGraph;
    }(Graph));
    /*---- Minor graph object classes ----*/
    var GObject = /** @class */ (function () {
        function GObject() {
            this.opacity = 0.0;
        }
        GObject.prototype.fade = function (delta) {
            this.opacity = Math.max(Math.min(this.opacity + delta, 1.0), 0.0);
        };
        return GObject;
    }());
    var GNode = /** @class */ (function (_super) {
        __extends(GNode, _super);
        function GNode(posX, // Horizontal position in relative coordinates, typically in the range [0.0, relWidth], where relWidth <= 1.0
        posY, // Vertical position in relative coordinates, typically in the range [0.0, relHeight], where relHeight <= 1.0
        radius, // Radius of the node, a positive real number
        velX, // Horizontal velocity in relative units (not pixels)
        velY) {
            var _this = _super.call(this) || this;
            _this.posX = posX;
            _this.posY = posY;
            _this.radius = radius;
            _this.velX = velX;
            _this.velY = velY;
            _this.dPosX = 0;
            _this.dPosY = 0;
            return _this;
        }
        return GNode;
    }(GObject));
    var GEdge = /** @class */ (function (_super) {
        __extends(GEdge, _super);
        function GEdge(nodeA, // A reference to the node object representing one side of the undirected edge
        nodeB) {
            var _this = _super.call(this) || this;
            _this.nodeA = nodeA;
            _this.nodeB = nodeB;
            return _this;
        }
        return GEdge;
    }(GObject));
    /*---- Union-find data structure ----*/
    // A heavily stripped down version of the code originally from
    // https://www.nayuki.io/page/disjoint-set-data-structure .
    var DisjointSet = /** @class */ (function () {
        function DisjointSet(size) {
            this.parents = [];
            this.ranks = [];
            for (var i = 0; i < size; i++) {
                this.parents.push(i);
                this.ranks.push(0);
            }
        }
        DisjointSet.prototype.mergeSets = function (i, j) {
            var repr0 = this.getRepr(i);
            var repr1 = this.getRepr(j);
            if (repr0 == repr1)
                return false;
            var cmp = this.ranks[repr0] - this.ranks[repr1];
            if (cmp >= 0) {
                if (cmp == 0)
                    this.ranks[repr0]++;
                this.parents[repr1] = repr0;
            }
            else
                this.parents[repr0] = repr1;
            return true;
        };
        DisjointSet.prototype.getRepr = function (i) {
            if (this.parents[i] != i)
                this.parents[i] = this.getRepr(this.parents[i]);
            return this.parents[i];
        };
        return DisjointSet;
    }());
    /*---- Initialization ----*/
    if (!("hypot" in Math)) { // Polyfill
        Math.hypot = function (x, y) {
            return Math.sqrt(x * x + y * y);
        };
    }
    main();
})(app || (app = {}));
