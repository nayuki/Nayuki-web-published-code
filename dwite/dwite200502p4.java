import java.io.*;
import java.util.StringTokenizer;


public class dwite200502p4{

 private static String problem="41";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   int[] dimension=new int[st.countTokens()-1];
   for(int i=0;i<dimension.length;i++)dimension[i]=Integer.parseInt(st.nextToken());
   int[] cost=calculateCost(dimension);
   out.println(cost[0]+" "+cost[1]);}}

 private static int[] calculateCost(int[] dimension){
  int n=dimension.length-1;
  int[] min=new int[n*n],max=new int[n*n];
  for(int i=0;i<n-1;i++)max[i*(n+1)+1]=min[i*(n+1)+1]=dimension[i]*dimension[i+1]*dimension[i+2];
  for(int i=3;i<=n;i++){
   for(int j=0;j<=n-i;j++){
    int tp=dimension[j]*dimension[j+i];
    int tpmin0=tp*dimension[j+1];
    int tpmax0=tpmin0+max[(j+1)*n+j+i-1];
    tpmin0+=min[(j+1)*n+j+i-1];
    for(int k=2;k<i;k++){
     int tpmin1=tp*dimension[j+k];
     int tpmax1=tpmin1+max[j*(n+1)+k-1]+max[(j+k)*n+j+i-1];
     tpmin1+=min[j*(n+1)+k-1]+min[(j+k)*n+j+i-1];
     if(tpmin1<tpmin0)tpmin0=tpmin1;
     if(tpmax1>tpmax0)tpmax0=tpmax1;}
    min[j*(n+1)+i-1]=tpmin0;
    max[j*(n+1)+i-1]=tpmax0;}}
  return new int[]{min[n-1],max[n-1]};}


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