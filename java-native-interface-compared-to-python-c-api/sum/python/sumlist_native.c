/* 
 * Sum list (Python version)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
 */

// For CPython 3 only.

#include <Python.h>
#include <stddef.h>
#include <stdint.h>


/* 
 * Given a sequence of integers, this returns the sum of all the numbers modulo 2^32.
 */
static PyObject *get_sum32(PyObject *self, PyObject *seq) {
	uint32_t result = 0;
	Py_ssize_t len = PySequence_Length(seq);
	Py_ssize_t i;
	for (i = 0; i < len; i++) {  // Sum every element
		PyObject *item = PySequence_GetItem(seq, i);
		result += (uint32_t)PyLong_AsUnsignedLongMask(item);
		Py_DECREF(item);
	}
	return PyLong_FromUnsignedLong(result);
}


PyMODINIT_FUNC PyInit_sumlist_native(void) {
	static PyMethodDef methodDesc[] = {
		{"get_sum32", get_sum32, METH_O, "Calculate the sum of a sequence"},
		{NULL, NULL, 0, NULL},
	};
	static struct PyModuleDef moduleDesc = {
		PyModuleDef_HEAD_INIT,
		"sumlist_native",
		NULL,
		-1,
		methodDesc,
	};
	return PyModule_Create(&moduleDesc);
}
