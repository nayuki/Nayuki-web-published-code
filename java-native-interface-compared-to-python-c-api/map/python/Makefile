# 
# Create dict (Python version)
# 
# Copyright (c) 2016 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 


# ---- Top-level targets ----

build: createdict_native.so

run: build
	python3 -B createdict.py

clean:
	rm -f createdict_native.so
	rm -rf build

.PHONY: build run clean


# ---- Binary object files ----

createdict_native.so: createdict_native.c
	python3 -B setup.py build
	mv build/lib*/*.so $@
