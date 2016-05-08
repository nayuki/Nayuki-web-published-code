/* 
 * Create dict (Python version)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
 */

// For CPython 3 only.

#include <Python.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>


static PyObject *create_dict(PyObject *self, PyObject *args) {
	// Check and parse argument
	int num;
	if (!PyArg_ParseTuple(args, "i", &num) || num < 0)
		Py_RETURN_NONE;
	
	// Get function handle
	PyObject *createdictModule = PyImport_ImportModule("createdict");
	PyObject *createdictIsPrime = PyObject_GetAttrString(createdictModule, "is_prime");
	Py_DECREF(createdictModule);
	
	// Initialize variables
	PyObject *result = PyDict_New();
	size_t scap = 1;
	char *s = malloc(scap * sizeof(char));
	memset(s, 0, scap * sizeof(char));
	int i = 1;
	int c = 0;
	
	// Add entries to dict
	while (PyDict_Size(result) < num) {
		PyObject *isPrimeResult = PyObject_CallFunction(createdictIsPrime, "i", i);
		if (PyLong_AsLong(isPrimeResult)) {  // bool -> int
			PyObject *keyObj = PyLong_FromLong(i);
			PyObject *valObj = PyUnicode_FromString(s);
			PyDict_SetItem(result, keyObj, valObj);  // Steals both references
			memset(s, 0, scap * sizeof(char));
		}
		Py_DECREF(isPrimeResult);
		
		// Increase string buffer capacity
		if (strlen(s) + 1 >= scap) {
			scap *= 2;
			char *temp = malloc(scap * sizeof(char));
			memset(temp, 0, scap * sizeof(char));
			strcpy(temp, s);
			free(s);
			s = temp;
		}
		
		// Append and increment
		char ch[] = {(char)('a' + c), '\0'};
		strcat(s, ch);
		c = (c + 1) % 26;
		i += 2;
	}
	
	// Epilog
	free(s);
	Py_DECREF(createdictIsPrime);
	return result;
}


PyMODINIT_FUNC PyInit_createdict_native(void) {
	static PyMethodDef methodDesc[] = {
		{"create_dict", create_dict, METH_VARARGS, "Create a dictionary of prime numbers to strings"},
		{NULL, NULL, 0, NULL},
	};
	static struct PyModuleDef moduleDesc = {
		PyModuleDef_HEAD_INIT,
		"createdict_native",
		NULL,
		-1,
		methodDesc,
	};
	return PyModule_Create(&moduleDesc);
}
