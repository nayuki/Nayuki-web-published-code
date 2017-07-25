# 
# Sum list (Python version)
# 
# Copyright (c) 2017 Project Nayuki
# All rights reserved. Contact Nayuki for licensing.
# https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
# 

import distutils.core


distutils.core.setup(
	ext_modules = [
		distutils.core.Extension(
			"sumlist_native",
			sources = ["sumlist_native.c"],
			extra_compile_args=["-std=c99"],
		)
	]
)
