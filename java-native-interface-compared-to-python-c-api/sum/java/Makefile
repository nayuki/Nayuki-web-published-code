# 
# Sum array (Java version)
# 
# Copyright (c) 2016 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 


# You will need to change the include paths to match your build environment
CFLAGS += -Wall -shared -fPIC -O
CFLAGS += -I /usr/lib/jvm/java-1.8.0-openjdk-amd64/include/
CFLAGS += -I /usr/lib/jvm/java-1.8.0-openjdk-amd64/include/linux/


# ---- Top-level rules ----

build: SumArray.class libsumarray.so

run: build
	java -Djava.library.path=. SumArray

clean:
	rm -f SumArray.class libsumarray.so

.PHONY: build run clean


# ---- Binary object files ----

SumArray.class: SumArray.java
	javac $<

libsumarray.so: sumarray.c
	$(CC) $(CFLAGS) -o $@ $^
