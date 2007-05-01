import java.io.*;


public class dwite200412p4{

 static String problem="41";
 static boolean DEBUGIN =false;
 static boolean DEBUGOUT=false;


 static boolean[] isPrime;


 static void main(BufferedReader in,PrintWriter out) throws IOException{
  int n=Integer.parseInt(in.readLine());
  if(isPrime[n])out.println("PRIME");
//  else out.println(countSums(n,3,0));
//  else out.println(countSumsSemifast(n,3,0,0));
  else out.println(countSumsFast(n));}

 static int countSums(int sum,int terms,int minimum){ // Returns the number of unordered sums that add up to 'sum' with exactly 'terms' prime terms, each of which is at least 'minimum'.
  if(terms==1){
   if(isPrime[sum]&&sum>=minimum)return 1;
   else return 0;}
  else{
   int count=0;
   for(int i=minimum;i<=sum;i++){
    if(isPrime[i])count+=countSums(sum-i,terms-1,i);}
   return count;}}

 static int[] primes;
 static int primesLength;

 static int countSumsSemifast(int sum,int terms,int minimum,int minimumIndex){ // Assumed: primes[minimumIndex] >= minimum
  if(primes==null){
   primes=new int[isPrime.length];
   primesLength=0;
   for(int i=0;i<isPrime.length;i++){
    if(isPrime[i]){
     primes[primesLength]=i;
     primesLength++;}}}
  if(terms==1){
   if(isPrime[sum]&&sum>=minimum)return 1;
   else return 0;}
  else{
   int count=0;
   for(int i=minimumIndex,end=sum/terms;i<primesLength&&primes[i]<=end;i++)count+=countSumsSemifast(sum-primes[i],terms-1,primes[i],i);
   return count;}}

 static int countSumsFast(int sum){
  if(primes==null){
   primes=new int[isPrime.length];
   primesLength=0;
   for(int i=0;i<isPrime.length;i++){
    if(isPrime[i]){
     primes[primesLength]=i;
     primesLength++;}}}
  int count=0;
  for(int i=0,iend=sum/3;i<primesLength&&primes[i]<=iend;i++){
   int temp=sum-primes[i];
   for(int j=i,jend=temp/2;j<primesLength&&primes[j]<=jend;j++){
    if(isPrime[temp-primes[j]])count++;}} // Implicit: temp-primes[j] >= primes[j] (because of jend)
  return count;}


 static boolean[] sievePrime(int n){
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


 public static void main(String[] args) throws IOException{
  InputStream  in0 =DEBUGIN ?System.in :new FileInputStream("DATA"+problem+".txt");
  OutputStream out0=DEBUGOUT?System.out:new FileOutputStream("OUT"+problem+".txt");
  InputStreamReader in1=new InputStreamReader(in0,"US-ASCII");
  BufferedReader in2=new BufferedReader(in1);
  BufferedOutputStream out1=new BufferedOutputStream(out0);
  OutputStreamWriter out2=new OutputStreamWriter(out1,"US-ASCII");
  PrintWriter out3=new PrintWriter(out2,true);
  isPrime=sievePrime(99999);
  for(int i=0;i<5;i++)main(in2,out3);
  in2.close();
  in1.close();
  in0.close();
  out3.close();
  out2.close();
  out1.close();
  out0.close();}}