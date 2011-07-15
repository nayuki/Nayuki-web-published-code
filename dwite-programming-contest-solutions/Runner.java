package dwite;


public final class Runner {
	
	public static void run(String inFilename, String outFilename, Solution sol) {
		run(new Io(inFilename, outFilename), sol);
	}
	
	
	public static void run(Io io, Solution sol) {
		sol.io = io;
		sol.run();
	}
	
	
	
	private Runner() {}
	
}
