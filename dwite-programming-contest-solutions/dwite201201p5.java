// DWITE - January 2012 - Problem 5: Comet Vomit
// Solution by Nayuki Minase


public final class dwite201201p5 extends DwiteSolution {
	
	public static void main(String[] args) {
		DwiteRunner.run("DATA5.txt", "OUT5.txt", new dwite201201p5());
	}
	
	
	protected void runOnce() {
		int[][] dust = new int[100000][3];
		int dustCount = 0;
		
		int n = io.readIntLine();
		for (int j = 0; j < n; j++) {
			io.tokenizeLine();
			int a = io.readIntToken();
			int b = io.readIntToken();
			int c = io.readIntToken();
			int d = io.readIntToken();
			int e = io.readIntToken();
			int f = io.readIntToken();
			int g = io.readIntToken();
			int h = io.readIntToken();
			int i = io.readIntToken();
			int u = io.readIntToken();
			int v = io.readIntToken();
			
			for (int t = u; t <= v; t++, dustCount++) {
				dust[dustCount] = new int[] {
					a*t*t + b*t + c,
					d*t*t + e*t + f,
					g*t*t + h*t + i
				};
			}
		}
		
		int globalMax = 0;
		for (int xSign = -1; xSign <= 1; xSign += 2) {
			for (int ySign = -1; ySign <= 1; ySign += 2) {
				for (int zSign = -1; zSign <= 1; zSign += 2) {
					int min = Integer.MAX_VALUE;
					int max = Integer.MIN_VALUE;
					for (int i = 0; i < dustCount; i++) {
						int position = xSign * dust[i][0] + ySign * dust[i][1] + zSign * dust[i][2];
						min = Math.min(position, min);
						max = Math.max(position, max);
					}
					globalMax = Math.max(max - min, globalMax);
				}
			}
		}
		io.println(globalMax);
	}
	
}
