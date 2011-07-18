// DWITE - January 2011 - Problem 4: Mountain Hiking
// Solution by Nayuki Minase

import java.util.Arrays;


public final class dwite201101p4 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA4.txt", "OUT4.txt", new dwite201101p4());
	}
	
	
	protected void runOnce() {
		// Read terrain height
		int[][] height = new int[10][10];
		for (int i = 0; i < height.length; i++) {
			String line = io.readLine();
			for (int j = 0; j < height[i].length; j++)
				height[i][j] = line.charAt(j) - '0';
		}
		io.readLine();  // Discard line of hyphens
		
		// Initialize distances
		int[][] distance = new int[height.length][height[0].length];
		for (int i = 0; i < distance.length; i++) {
			Arrays.fill(distance[i], 999);
			distance[i][0] = 0;
		}
		
		// Compute all minimum distances
		for (int i = 0; i < 100; i++) {
			for (int j = 0; j < height.length; j++) {
				for (int k = 1; k < height[j].length; k++) {
					int min = distance[j][k];
					if (Math.abs(height[j][k] - height[j][k - 1]) <= 1)  // From left
						min = Math.min(distance[j][k - 1] + 1, min);
					if (j >= 1 && Math.abs(height[j][k] - height[j - 1][k]) <= 1)  // From above
						min = Math.min(distance[j - 1][k] + 1, min);
					if (j < height.length - 1 && Math.abs(height[j][k] - height[j + 1][k]) <= 1)  // From below
						min = Math.min(distance[j + 1][k] + 1, min);
					distance[j][k] = min;
				}
			}
		}
		
		// Find minimum distance on the right edge
		int min = 999;
		for (int i = 0; i < height.length; i++)
			min = Math.min(distance[i][height[i].length - 1], min);
		if (min != 999)
			io.println(min);
		else
			io.println("IMPOSSIBLE");
	}
	
}
