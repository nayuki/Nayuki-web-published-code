# 
# Sum list (Python version)
# 
# Copyright (c) 2016 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 


# ---- Top-level targets ----

build: sumlist_native.so

run: build
	python3 -B sumlist.py

clean:
	rm -f sumlist_native.so
	rm -rf build

.PHONY: build run clean


# ---- Binary object files ----

sumlist_native.so: sumlist_native.c
	python3 -B setup.py build
	mv build/lib*/*.so $@
