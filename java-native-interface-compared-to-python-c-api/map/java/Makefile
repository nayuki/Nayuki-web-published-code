# 
# Create map (Java version)
# 
# Copyright (c) 2017 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 


# You will need to change the include paths to match your build environment
CFLAGS += -std=c99 -Wall -shared -fPIC -O
CFLAGS += -I /usr/lib/jvm/java-1.8.0-openjdk-amd64/include/
CFLAGS += -I /usr/lib/jvm/java-1.8.0-openjdk-amd64/include/linux/


# ---- Top-level rules ----

build: CreateMap.class libcreatemap.so

run: build
	java -Djava.library.path=. CreateMap

clean:
	rm -f CreateMap.class libcreatemap.so

.PHONY: build run clean


# ---- Binary object files ----

CreateMap.class: CreateMap.java
	javac $<

libcreatemap.so: createmap.c
	$(CC) $(CFLAGS) -o $@ $^
