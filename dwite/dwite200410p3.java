import java.io.*;
import java.util.StringTokenizer;


public class dwite200410p3{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA3");
  out0=new FileOutputStream("OUT3");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  int n=Integer.parseInt(in.readLine());
  String[] name=new String[n];
  double[] h=new double[n];
  for(int i=0;i<n;i++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   name[i]=st.nextToken();
   h[i]=Double.parseDouble(st.nextToken());
   String m=st.nextToken();
   if(m.equals("m"))h[i]*=1000;
   else if(m.equals("dm"))h[i]*=100;
   else if(m.equals("cm"))h[i]*=10;}
   sort(name,h);
   sort(h,name);
  for(int i=0;i<5;i++)out.println(name[i]);
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}


 private static void sort(String[] n,double[] h){
  for(int i=h.length-1;i>0;i--){
   for(int j=0;j<i;j++){
    if(n[j].compareTo(n[j+1])>0){
     String tps=n[j];
     n[j]=n[j+1];
     n[j+1]=tps;
     double tpd=h[j];
     h[j]=h[j+1];
     h[j+1]=tpd;}}}}

 private static void sort(double[] h,String[] n){
  for(int i=h.length-1;i>0;i--){
   for(int j=0;j<i;j++){
    if(h[j]<h[j+1]){
     double tpd=h[j];
     h[j]=h[j+1];
     h[j+1]=tpd;
     String tps=n[j];
     n[j]=n[j+1];
     n[j+1]=tps;}}}}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;}