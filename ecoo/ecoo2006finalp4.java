import java.io.*;
import java.util.*;


public class ecoo2006finalp4{

 static Set<String> dictionary;
 static Map<String,Set<String>> connections;


 static void main(String start,String end) throws IOException{
  if(!dictionary.contains(start)||!dictionary.contains(end))throw new AssertionError("Word not in dictionary");

  Map<String,String> comeFrom=new HashMap<String,String>();
  Queue<String> queue=new LinkedList<String>();
  comeFrom.put(end,"*****");
  queue.offer(end);
  while(true){
   String word=queue.poll();
   if(word==null)throw new AssertionError("No path"); // Empty queue
   if(word.equals(start))break;
   for(String neighbour:connections.get(word)){
    if(!comeFrom.containsKey(neighbour)){
     comeFrom.put(neighbour,word);
     queue.offer(neighbour);}}}

  String current=start;
  System.out.print(start);
  while(true){
   current=comeFrom.get(current);
   if(current.equals("*****"))break;
   System.out.printf(" - %s",current);}
  System.out.println();}


 // Returns the number of letters that strings x and y differ by. Assumes that x and y have the same length.
 static int hammingDistance(String x,String y){
  int count=0;
  for(int i=0;i<x.length();i++){
   if(x.charAt(i)!=y.charAt(i))count++;}
  return count;}


 public static void main(String[] args) throws IOException{
  BufferedReader in=new BufferedReader(new InputStreamReader(new FileInputStream("DATA41.txt"),"US-ASCII"));

  String[][] pairs=new String[5][2];
  for(int i=0;i<pairs.length;i++){
   pairs[i][0]=in.readLine();
   pairs[i][1]=in.readLine();}

  int wordCount=Integer.parseInt(in.readLine());
  dictionary=new HashSet<String>();
  for(int i=0;i<wordCount;i++)dictionary.add(in.readLine());
  in.close();

  connections=new HashMap<String,Set<String>>();
  for(String word:dictionary)connections.put(word,new HashSet<String>());
  for(String x:dictionary){
   for(String y:dictionary){
    if(hammingDistance(x,y)==1)connections.get(x).add(y);}}

  for(int i=0;i<pairs.length;i++)main(pairs[i][0],pairs[i][1]);}}