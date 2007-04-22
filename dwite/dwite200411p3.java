import java.io.*;
import java.math.BigInteger;
import java.util.StringTokenizer;


public class dwite200411p3{

 public static void main(String[] arg) throws IOException{
  in0=new FileInputStream("DATA31.txt");
  out0=new FileOutputStream("OUT31.txt");
  in1=new InputStreamReader(in0,"US-ASCII");
  out1=new BufferedOutputStream(out0);
  out2=new OutputStreamWriter(out1,"US-ASCII");
  in=new BufferedReader(in1);
  out=new PrintWriter(out2,true);
  for(int ii=0;ii<5;ii++){
   StringTokenizer st=new StringTokenizer(in.readLine()," ");
   int[] poly=new int[Integer.parseInt(st.nextToken())+1];
   for(int i=0;i<poly.length;i++)poly[i]=Integer.parseInt(st.nextToken());
   int[] rootthingy=new int[0];
   int q=poly[0];
   while(true){
    dwite200411p3 root=findRoot(poly);
    if(root==null)break;
    rootthingy=insertSorted(rootthingy,q/root.d.intValue()*root.n.intValue());
    poly=divide(poly,root);}
   for(int i=0;i<rootthingy.length;i++){
    if(i!=0)out.print(" ");
    out.print(rootthingy[i]);}
   out.println();}
  in.close();
  in1.close();
  in0.close();
  out.close();
  out2.close();
  out1.close();
  out0.close();}


 private static dwite200411p3 findRoot(int[] poly){
  int p=Math.abs(poly[poly.length-1]);
  int q=Math.abs(poly[0]);
  for(int i=1;i<=q;i++){
   if(q%i!=0)continue;
   for(int j=1;j<=p;j++){
    if(p%j!=0)continue;
    if(isRoot(poly,new dwite200411p3( j,i)))return new dwite200411p3( j,i);
    if(isRoot(poly,new dwite200411p3(-j,i)))return new dwite200411p3(-j,i);}}
  return null;}

 private static int[] divide(int[] poly,dwite200411p3 root){
  int q=root.d.intValue();
  int p=root.n.intValue();
  int[] polynew=new int[poly.length-1];
  for(int i=0;i<poly.length-1;i++){
   int m=polynew[i]=poly[i]/q;
   poly[i]-=q*m;
   poly[i+1]+=p*m;}
  return polynew;}

 private static boolean isRoot(int[] poly,dwite200411p3 x){
  dwite200411p3 val=new dwite200411p3(poly[0]);
  for(int i=1;i<poly.length;i++)val=val.mul(x).add(poly[i]);
  return val.isZero();}

 private static int[] insertSorted(int[] in,int item){
  int[] out=new int[in.length+1];
  int i;
  for(i=0;i<in.length&&in[i]<=item;i++)out[i]=in[i];
  out[i]=item;
  for(i++;i<out.length;i++)out[i]=in[i-1];
  return out;}


 private static InputStream in0;
 private static OutputStream out0;

 private static InputStreamReader in1;
 private static BufferedOutputStream out1;
 private static OutputStreamWriter out2;

 private static BufferedReader in;
 private static PrintWriter out;



 private BigInteger n,d;


 public dwite200411p3(int num){
  n=BigInteger.valueOf(num);
  d=BigInteger.ONE;}

 public dwite200411p3(int num,int den){
  n=BigInteger.valueOf(num);
  d=BigInteger.valueOf(den);
  simplify();}

 public dwite200411p3(BigInteger num,BigInteger den){
  n=num;
  d=den;
  simplify();}


 public dwite200411p3 add(int x){
  return new dwite200411p3(n.add(BigInteger.valueOf(x).multiply(d)),d);}

 public dwite200411p3 add(dwite200411p3 x){
  return new dwite200411p3(n.multiply(x.d).add(x.n.multiply(d)),d.multiply(x.d));}

 public dwite200411p3 mul(dwite200411p3 x){
  return new dwite200411p3(n.multiply(x.n),d.multiply(x.d));}

 public boolean isZero(){
  return n.equals(BigInteger.ZERO);}


 public String toString(){
  return n+"/"+d;}


 private void simplify(){
  BigInteger gcf=n.gcd(d);
  n=n.divide(gcf);
  d=d.divide(gcf);}}