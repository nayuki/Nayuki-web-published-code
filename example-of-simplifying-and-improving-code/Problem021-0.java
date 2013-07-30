import java.util.ArrayList;
import java.util.Iterator;

public class Problem021
{
	private static int MSum;
	private static int NSum;

	private static int sumList(ArrayList<Integer> list)
	{
		int sum = 0;

		for (Iterator<Integer> iter = list.iterator(); iter.hasNext();)
		{
			sum += iter.next();
		}

		return sum;
	}

	private static ArrayList<Integer> createList(int n)
	{
		// Creates a list of integers that evenly divide into n excluding n itself
		long root = Math.round(Math.sqrt(n)) + 1;

		ArrayList<Integer> test = new ArrayList<Integer>();
		test.add(1);

		for (int i = 2; i <= root; i++)
		{
			if (n % i == 0)
			{
				test.add(i);		// Add the divisor & its complement
				test.add(n/i);
			}
		}

		return test;
	}

	private static boolean isAmicable(int n)
	{
		/*** If n's divisors form an amicable set, return true ***/

		// Create a list of n's proper divisors
		ArrayList<Integer> NList = new ArrayList<Integer>(createList(n));		

		// Sum n's proper divisors (NSum)
		NSum = sumList(NList);

		// Create list of NSum's proper divisors (MList)
		ArrayList<Integer> MList = new ArrayList<Integer>(createList(NSum));

		// Sum m's proper divisors (MSum)
		MSum = sumList(MList);

		if ((MSum == n) && (MSum != NSum))
			return true;	

		return false;
	}

	public static void main(String[] args)
	{
		long begin = System.currentTimeMillis();

		int sum = 0;
		for (int i = 0; i < 10000; i++)
		{
			if (isAmicable(i))
			{
				sum += NSum;
			}
		}

		System.out.println(sum);

		long end = System.currentTimeMillis();
		System.out.println(end-begin + "ms");
	}
}
