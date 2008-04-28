import java.io.*;
import java.util.*;


// DWITE - January 2006 - Problem 5: Distance Between Towns
public class dwite200601p5 {
	
	public static void main(BufferedReader in, PrintWriter out) throws IOException {
		int n = Integer.parseInt(in.readLine());
		Graph graph = new Graph();
		for (int i = 0; i < n; i++) {
			StringTokenizer st = new StringTokenizer(in.readLine(), " ");
			String edge = st.nextToken();
			int dist = Integer.parseInt(st.nextToken());
			Node a = graph.getOrAddNode(edge.substring(0, 1));
			Node b = graph.getOrAddNode(edge.substring(1, 2));
			a.addEdge(new Edge(b, dist));
			b.addEdge(new Edge(a, dist));
		}
			
		for (int i = 0; i < 5; i++)
			mainOnce(in, out, graph);
	}
	
	
	static void mainOnce(BufferedReader in, PrintWriter out, Graph graph) throws IOException {
		String line = in.readLine();
		Node src  = graph.getOrAddNode(line.substring(0, 1));
		Node dest = graph.getOrAddNode(line.substring(1, 2));
		graph.clearDistances();
		src.distance = 0;
		
		// Dijkstra's algorithm
		Queue<Node> queue = new PriorityQueue<Node>();
		queue.offer(src);
		while (true) {
			Node node = queue.poll();
			if (node == null)
				throw new AssertionError("No path exists");
			else if (node == dest)
				break;
			else {
				for (Edge edge : node.edges) {
					int newdist = node.distance + edge.distance;
					if (newdist < edge.destination.distance) {
						edge.destination.distance = newdist;
						queue.offer(edge.destination);
					}
				}
			}
		}
		
		out.println(dest.distance);
	}
	
	
	
	static String infile = "DATA31.txt";  // Specify null to use System.in
	static String outfile = "OUT31.txt";  // Specify null to use System.out
	
	
	public static void main(String[] args) throws IOException {
		InputStream in0;
		if (infile != null) in0 = new FileInputStream(infile);
		else in0 = System.in;
		Reader in1 = new InputStreamReader(in0, "US-ASCII");
		BufferedReader in = new BufferedReader(in1);
		
		OutputStream out0;
		if (outfile != null) out0 = new FileOutputStream(outfile);
		else out0 = System.out;
		Writer out1 = new OutputStreamWriter(out0, "US-ASCII");
		PrintWriter out = new PrintWriter(out1, true);
		
		main(in, out);
		
		in.close();
		in1.close();
		in0.close();
		out.close();
		out1.close();
		out0.close();
	}
	
	
	
	static class Graph {
		
		Collection<Node> nodes;
		Map<String,Node> nodeByName;
		
		
		
		Graph() {
			nodes = new ArrayList<Node>();
			nodeByName = new HashMap<String,Node>();
		}
		
		
		
		Node getOrAddNode(String name) {
			if (!nodeByName.containsKey(name)) {
				Node node = new Node(name);
				nodes.add(node);
				nodeByName.put(name, node);
			}
			return nodeByName.get(name);
		}
		
		
		void clearDistances() {
			for (Node node : nodes)
				node.distance = Integer.MAX_VALUE;
		}
		
	}
	
	
	
	static class Node implements Comparable<Node> {
		
		String name;
		Collection<Edge> edges;
		
		int distance;
		
		
		
		Node(String name) {
			this.name = name;
			edges = new ArrayList<Edge>();
			distance = -1;
		}
		
		
		
		void addEdge(Edge e) {
			edges.add(e);
		}
		
		public int compareTo(Node other) {
			if (distance < other.distance)
				return -1;
			else if (distance > other.distance)
				return  1;
			else
				return  0;
		}
		
	}
	
	
	
	static class Edge {
		
		Node destination;
		int distance;
		
		
		
		Edge(Node dest, int dist) {
			distance = dist;
			destination = dest;
		}
		
	}
	
}