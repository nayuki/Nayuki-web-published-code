import java.io.IOException;
import java.io.InputStream;


public interface BitInputStream {
	
	public int readBits(int n) throws IOException;
	
	public void readBytes(byte[] b, int off, int len) throws IOException;
	
	public InputStream detach() throws IOException;
	
	public void close() throws IOException;
	
}
