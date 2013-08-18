# 
# Next lexicographical permutation algorithm (Python)
# By Nayuki Minase, 2013. Public domain.
# http://nayuki.eigenstate.org/page/next-lexicographical-permutation-algorithm
# 


# 
# Computes the next lexicographical permutation of the specified list in place,
# returning whether a next permutation existed. (Returns False when the argument
# is already the last possible permutation.)
# 
def next_permutation(arr):
    # Find non-increasing suffix
    i = len(arr) - 1
    while i > 0 and arr[i - 1] >= arr[i]:
        i -= 1
    if i <= 0:
        return False
    
    # Find successor to pivot
    j = len(arr) - 1
    while arr[j] <= arr[i - 1]:
        j -= 1
    arr[i - 1], arr[j] = arr[j], arr[i - 1]
    
    # Reverse suffix
    j = len(arr) - 1
    while i < j:
        arr[i], arr[j] = arr[j], arr[i]
        i += 1
        j -= 1
    return True

# Example:
#   arr = [0, 1, 0]
#   next_permutation(arr)  (returns True)
#   arr has been modified to be [1, 0, 0]
