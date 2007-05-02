import java.io.*;


public class ecoo2006regionalp4{

 public static void main(BufferedReader in) throws IOException{
  String word0=in.readLine();
  String word1=in.readLine();
  String word2=in.readLine();
  int[] word0index;
  int[] word1index;
  int[] word2index;
  int assigned=0; // Number of distict letters assigned
  {int[] index=new int[256];
   for(int i=0;i<index.length;i++)index[i]=-1;
   String allword=word0+word1+word2;
   for(int i=0;i<allword.length();i++){ // Give an index to each letter present
    char c=allword.charAt(i);
    if(index[c]==-1){
     index[c]=assigned;
     assigned++;}}
   if(assigned>10)throw new RuntimeException();
   word0index=assign(word0,index);
   word1index=assign(word1,index);
   word2index=assign(word2,index);}
  int[] perm=new int[10]; // Current digit assignment to test
  for(int i=0,end=permutation(10,assigned);;i++){
   if(i==end)throw new RuntimeException();
   for(int j=0;j<10;j++)perm[j]=j;
   for(int j=0,tp=i;j<assigned;tp/=10-j,j++)swap(perm,j,j+tp%(10-j));
   if(isValid(word0index,word1index,word2index,perm))break;}
  System.out.println(pad(word0)+"     "+pad(Integer.toString(toNumber(word0index,perm))));
  System.out.println(pad(word1)+"     "+pad(Integer.toString(toNumber(word1index,perm))));
  System.out.println(pad(word2)+"     "+pad(Integer.toString(toNumber(word2index,perm))));
  System.out.println();}


 static int[] assign(String word,int[] index){
  int[] wordindex=new int[word.length()];
  for(int i=0;i<wordindex.length;i++)wordindex[i]=index[word.charAt(i)];
  return wordindex;}

 static boolean isValid(int[] word0index,int[] word1index,int[] word2index,int[] perm){
  if(perm[word0index[0]]==0||perm[word1index[0]]==0||perm[word2index[0]]==0)return false;
  return toNumber(word0index,perm)+toNumber(word1index,perm)==toNumber(word2index,perm);}

 static int toNumber(int[] wordindex,int[] perm){
  int s=0;
  for(int i=0;i<wordindex.length;i++)s=10*s+perm[wordindex[i]];
  return s;}

 public static int permutation(int n,int k){
  int p=1;
  for(;k>=1;n--,k--)p*=n;
  return p;}

 static void swap(int[] x,int i,int j){
  int tp=x[i];
  x[i]=x[j];
  x[j]=tp;}

 static String pad(String s){
  while(s.length()<8)s=" "+s;
  return s;}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA41.txt"));
  for(int i=0;i<5;i++)main(in);}}