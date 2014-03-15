# 
# Lowest SHA-512 value by brute force (Python)
# 
# Copyright (c) 2014 Nayuki Minase
# All rights reserved. Contact Nayuki for licensing.
# http://nayuki.eigenstate.org/page/lowest-sha512-value-by-brute-force
# 

import hashlib, sys


MSG_LEN = 12  # Can be any positive integer

def main():
    if sys.version_info.major == 2:
        message = ['a'] * MSG_LEN  # A list of characters because Python strings are immutable
        lowest_hash = '\xFF' * 64
        while True:
            # Hash and compare
            msg = "".join(message)
            hash = hashlib.sha512(msg)
            binhash = hash.digest()
            if binhash < lowest_hash:
                print(hash.hexdigest()[ : 32] + "... " + msg)
                lowest_hash = binhash
            
            # Increment message
            # e.g. "aa" -> "aa", "fnzz" -> "foaa"
            i = MSG_LEN - 1
            while i >= 0 and message[i] == 'z':
                message[i] = 'a'
                i -= 1
            if i < 0:
                break
            message[i] = chr(ord(message[i]) + 1)
            
        print("Search space exhausted")
    
    elif sys.version_info.major == 3:
        message = [ord('a')] * MSG_LEN
        lowest_hash = b'\xFF' * 64
        while True:
            # Hash and compare
            msg = bytes(message)
            hash = hashlib.sha512(msg)
            binhash = hash.digest()
            if binhash < lowest_hash:
                print(hash.hexdigest()[ : 32] + "... " + msg.decode("ASCII"))
                lowest_hash = binhash
            
            # Increment message
            # e.g. "aa" -> "aa", "fnzz" -> "foaa"
            i = MSG_LEN - 1
            while i >= 0 and message[i] == ord('z'):
                message[i] = ord('a')
                i -= 1
            if i < 0:
                break
            message[i] += 1
            
        print("Search space exhausted")
    
    else:
        raise Exception("Unsupported Python version")


if __name__ == "__main__":
    main()
