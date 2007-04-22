import java.io.*;
import java.util.StringTokenizer;


public class dwite200410p4{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA4");
  out0=new FileOutputStream("OUT4");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   int cd=Integer.parseInt(st.nextToken());
   int n=Integer.parseInt(st.nextToken());
   int[] size=new int[n];
   for(int i=0;i<n;i++)size[i]=Integer.parseInt(st.nextToken());
   int comb=1<<n;
   int max=0;
   for(int i=0;i<comb;i++){
    int sum=0;
    for(int j=0;j<n;j++){
     if((i&1<<j)!=0)sum+=size[j];
     if(sum>cd)break;}
    if(sum<=cd&&sum>max)max=sum;
    if(max==cd)break;}
   out.println(max);}
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;}