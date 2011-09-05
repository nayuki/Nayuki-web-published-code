public abstract class DwiteSolution {
	
	// The I/O object, presented as a field for convenience.
	protected DwiteIo io;
	
	
	
	// The constructor with nothing to initalize.
	public DwiteSolution() {}
	
	
	
	// By default, run() calls runOnce() 5 times.
	// For each DWITE solution, at least one of run() or runOnce() needs to be overridden.
	// If run() is overridden, then runOnce() does not necessarily need to be overridden or used.
	
	public void run() {
		for (int i = 0; i < 5; i++)
			runOnce();
	}
	
	
	protected void runOnce() {}
	
}
