import java.io.*;
import java.util.StringTokenizer;


public class dwite200602p5{

 private static String problem="51";
 private static boolean DEBUGIN =false;
 private static boolean DEBUGOUT=false;


 private static boolean[] prime=sievePrime(1000000);


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  StringTokenizer st=new StringTokenizer(in.readLine()," ");
  int start=Integer.parseInt(st.nextToken());
  int end=Integer.parseInt(st.nextToken());
  int palin=0;
  for(;start<=end;start++){
   if(!prime[start])continue;
   if(isPalindrome(start))palin++;}
  out.println(palin);}


 private static boolean isPalindrome(int x){
  int len;
  int[] digit=new int[10];
  for(len=0;len<digit.length;){
   digit[len]=x%10;
   x/=10;
   len++;
   if(x==0)break;}
  for(int i=0;i<(len+1)/2;i++){
   if(digit[i]!=digit[len-i-1])return false;}
  return true;}

 private static boolean[] sievePrime(int n){
  boolean[] prime=new boolean[n+1];
  if(n>=2)prime[2]=true;
  for(int i=3;i<=n;i+=2)prime[i]=true;
  for(int i=3,e=sqrt(n);i<=e;i+=2){
   if(prime[i]){
    for(int j=i*3;j<=n;j+=i<<1)prime[j]=false;}}
  return prime;}

 private static int sqrt(int x){
  int y=0;
  for(int i=15;i>=0;i--){
   y|=1<<i;
   if(y>46340||y*y>x)y^=1<<i;}
  return y;}


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