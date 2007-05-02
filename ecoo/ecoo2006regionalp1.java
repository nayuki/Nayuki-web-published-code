import java.io.*;
import java.util.Random;


public class ecoo2006regionalp1{

 static String alphabet0="ABCDEFGHIJKLMNOP";
 static String alphabet1="QRSTUVWXYZKLMNOP";

 static Random rand=new Random();


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

 static String encrypt(String plaintext){ // Bonus
  StringBuffer ciphertext=new StringBuffer();
  int lastdigit=0;
  for(int i=0;i<plaintext.length();i++){
   if(plaintext.charAt(i)>=0x80)throw new AssertionError("Not ASCII");
   int high=plaintext.charAt(i)>>>4&0xF;
   int low =plaintext.charAt(i)>>>0&0xF;
   lastdigit=high+=lastdigit;
   if(rand.nextBoolean())ciphertext.append(alphabet0.charAt(high&0xF));
   else                  ciphertext.append(alphabet1.charAt(high&0xF));
   lastdigit=low+=lastdigit;
   if(rand.nextBoolean())ciphertext.append(alphabet0.charAt(low &0xF));
   else                  ciphertext.append(alphabet1.charAt(low &0xF));}
  return ciphertext.toString();}

 static String decrypt(String ciphertext){
  StringBuffer plaintext=new StringBuffer();
  int lastdigit=0;
  int currchar=0;
  for(int i=0;i<ciphertext.length();i++){
   int digit;
   if     (alphabet0.indexOf(ciphertext.charAt(i))!=-1)digit=alphabet0.indexOf(ciphertext.charAt(i));
   else if(alphabet1.indexOf(ciphertext.charAt(i))!=-1)digit=alphabet1.indexOf(ciphertext.charAt(i));
   else throw new AssertionError("Malformed ciphertext");
   currchar=currchar<<4|((digit-lastdigit)&0xF);
   lastdigit=digit;
   if((i+1)%2==0){
    plaintext.append((char)currchar);
    currchar=0;}}
  return plaintext.toString();}


 public static void main(String[] args) throws IOException{
  BufferedReader in=new BufferedReader(new InputStreamReader(new FileInputStream("DATA11.txt"),"US-ASCII"));
  for(int i=0;i<5;i++)main(in);
  in.close();}}