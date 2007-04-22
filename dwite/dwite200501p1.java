import java.io.*;


public class dwite200501p1{

 private static String problem="11";


 private static void main(BufferedReader in,PrintWriter out) throws IOException{
  int n=Integer.parseInt(in.readLine());
  String[] name=new String[n];
  int[] score=new int[n];
  for(int i=0;i<n;i++){
   name[i]=in.readLine();
   for(int j=0;j<9;j++)score[i]+=Integer.parseInt(in.readLine());}
  sortAscending(name,score);
  sortAscending(score,name);
  for(int i=0;i<5;i++)out.println(name[i]+" "+score[i]);}


 private static void sortAscending(int[] key,String[] data){
  for(int i=1,j;i<key.length;i++){
   int tp0=key[i];
   String tp1=data[i];
   for(j=i;j>=1&&key[j-1]>tp0;j--){
    key[j]=key[j-1];
    data[j]=data[j-1];}
   key[j]=tp0;
   data[j]=tp1;}}

 private static void sortAscending(String[] key,int[] data){
  for(int i=1,j;i<key.length;i++){
   String tp0=key[i];
   int tp1=data[i];
   for(j=i;j>=1&&key[j-1].compareTo(tp0)>0;j--){
    key[j]=key[j-1];
    data[j]=data[j-1];}
   key[j]=tp0;
   data[j]=tp1;}}


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