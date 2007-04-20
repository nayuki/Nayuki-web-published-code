import java.io.*;


public class dwite200510p1{

 private static String problem="11";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int r1=Integer.parseInt(in.readLine());
  int d1=Integer.parseInt(in.readLine());
  int d2=Integer.parseInt(in.readLine());
  int[] r2=toDigit(r1);
  int n1=occurrence(r2,d1);
  while(true){
   int n2=occurrence(r2,d2);
   if(n2==n1)break;
   if(n2<n1){
    for(int i=5;i>=0;i--){
     if(r2[i]!=d2){
      if(d2<r2[i]){
       increment(r2,i-1);
       for(;i<6;i++)r2[i]=0;}
      else r2[i]=d2;
      break;}}}
   else{
    for(int i=5;i>=0;i--){
     if(r2[i]==d2){
      increment(r2,i);
      break;}}}}
  int d=toNumber(r2)-r1;
  if(d<0)d+=1000000;
  out.println(toString(r2)+" "+d);}


 private static int occurrence(int[] dig,int d){
  int o=0;
  for(int i=0;i<6;i++){
   if(dig[i]==d)o++;}
  return o;}

 private static void increment(int[] dig,int ind){
  if(ind<0)return;
  for(dig[ind]++;dig[ind]==10;){
   dig[ind]=0;
   if(ind==0)break;
   ind--;
   dig[ind]++;}}

 private static int[] toDigit(int x){
  int[] dig=new int[6];
  for(int i=5;i>=0;i--,x/=10)dig[i]=x%10;
  return dig;}

 private static int toNumber(int[] dig){
  int s=0;
  for(int i=0;i<6;i++)s=s*10+dig[i];
  return s;}

 private static String toString(int[] dig){
  String s="";
  for(int i=0;i<6;i++)s+=dig[i];
  return s;}


 public static void main(String[] arg) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}