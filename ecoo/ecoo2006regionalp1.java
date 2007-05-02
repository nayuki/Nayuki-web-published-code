import java.io.*;


public class ecoo2006regionalp1{

 static void main(BufferedReader in) throws IOException{
  /* // Old version, converts to hexadecimal first
  String line=in.readLine();
  int[] message=new int[line.length()];
  for(int i=0;i<line.length();i++)message[i]=(line.charAt(i)-'A')%16;
  for(int i=message.length-1;i>=1;i--)message[i]=(message[i]-message[i-1]+16)%16;
  for(int i=0;i<message.length;i+=2)System.out.print((char)(message[i]<<4|message[i+1]));
  */
  System.out.println(decrypt(in.readLine()));
  System.out.println();}

 static String decrypt(String in){
  char[] out=new char[in.length()/2];
  for(int i=0,last=0,buffer=0;i<in.length();buffer<<=4){
   int curr=(in.charAt(i)-'A')&0xF;
   buffer|=(curr-last)&0xF;
   last=curr;
   i++;
   if(i%2==0){
    out[(i>>>1)-1]=(char)buffer;
    buffer=0;}}
  return new String(out);}


 public static void main(String[] arg) throws IOException{
  BufferedReader in=new BufferedReader(new FileReader("DATA11.txt"));
  for(int i=0;i<5;i++)main(in);}}