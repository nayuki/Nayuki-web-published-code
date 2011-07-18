public final class DwiteRunner {
	
	public static void run(String inFilename, String outFilename, DwiteSolution sol) {
		run(new DwiteIo(inFilename, outFilename), sol);
	}
	
	
	public static void run(DwiteIo io, DwiteSolution sol) {
		sol.io = io;
		sol.run();
	}
	
	
	
	private DwiteRunner() {}
	
}
