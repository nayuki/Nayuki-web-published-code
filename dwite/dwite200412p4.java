import java.io.*;


public class dwite200412p4{

 private static String problem="41";

 private static int[] prime;
 private static boolean[] iscomposite;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  sieve(100000);
  for(int ii=0;ii<5;ii++){
   int n=Integer.parseInt(in.readLine());
   if(!iscomposite[n])out.println("PRIME");
   else{
    int s=0;
    for(int i=0;i<prime.length;i++){
     if(prime[i]>=n)break;
     for(int j=i;j<prime.length;j++){
      int tp=prime[i]+prime[j];
      if(tp>=n)break;
      if(n-tp>=prime[j]&&!iscomposite[n-tp])s++;}}
    out.println(s);}}}

 private static void sieve(int n){
  iscomposite=new boolean[n];
  iscomposite[0]=iscomposite[1]=true;
  int end=(int)Math.sqrt(n);
  for(int i=2;i<=end;i++){
   if(iscomposite[i])continue;
   for(int j=i*2;j<n;j+=i)iscomposite[j]=true;}
  int[] tp=new int[n];
  int j=0;
  for(int i=0;i<n;i++){
   if(!iscomposite[i])tp[j++]=i;}
  prime=new int[j];
  for(int i=0;i<j;i++)prime[i]=tp[i];}


 public static void main(String[] arg) throws IOException{
  Object[] streams;
  streams=diskStreams();
  InputStreamReader in1=new InputStreamReader((InputStream)streams[0],"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream((OutputStream)streams[1]);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  main(in2,out3);
  in2.close();
  in1.close();
  out3.close();
  out2.close();
  out1.close();}

 private static Object[] diskStreams() throws IOException{
  return new Object[]{new FileInputStream("DATA"+problem+".txt"),new FileOutputStream("OUT"+problem+".txt")};}}