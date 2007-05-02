import java.io.*;


public class ecoo2006finalp4{

 static String[] dictionary;
 static int[] mindist;


 static void main(String start,String end) throws IOException{
  for(int i=0;i<mindist.length;i++)mindist[i]=Integer.MAX_VALUE;
  fill(findIndex(end),0);
  int index=findIndex(start);
  System.out.print(start);
  while(!dictionary[index].equals(end)){
   for(int i=0;i<dictionary.length;i++){
    if(difference(dictionary[index],dictionary[i])==1&&mindist[i]<mindist[index]){
     index=i;
     System.out.print(" - "+dictionary[i]);
     break;}}}
  System.out.println();}


 static void fill(int index,int dist){
  if(mindist[index]<=dist)return;
  mindist[index]=dist;
  for(int i=0;i<dictionary.length;i++){
   if(difference(dictionary[index],dictionary[i])==1)fill(i,dist+1);}}

 static int findIndex(String s){
  for(int i=0;i<dictionary.length;i++){
   if(dictionary[i].equals(s))return i;}
  return -1;}

 static int difference(String a,String b){
  int s=0;
  for(int i=0;i<5;i++){
   if(a.charAt(i)!=b.charAt(i))s++;}
  return s;}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA41.txt"));
  String[][] pair=new String[5][2];
  for(int i=0;i<5;i++){
   pair[i][0]=in.readLine();
   pair[i][1]=in.readLine();}
  int len=Integer.parseInt(in.readLine());
  dictionary=new String[len];
  mindist=new int[len];
  for(int i=0;i<len;i++)dictionary[i]=in.readLine();
  for(int i=0;i<5;i++)main(pair[i][0],pair[i][1]);}}