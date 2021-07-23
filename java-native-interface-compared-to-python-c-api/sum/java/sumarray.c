/* 
 * Sum array (Java version)
 * 
 * Copyright (c) 2021 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
 */

#include <stddef.h>
#include <stdint.h>
#include <jni.h>


JNIEXPORT jint JNICALL Java_SumArray_calcSum(JNIEnv *env, jclass clazz, jintArray array) {
	uint32_t sum = 0;
	jsize len = (*env)->GetArrayLength(env, array);
	jint *arr = (*env)->GetPrimitiveArrayCritical(env, array, NULL);
	for (jsize i = 0; i < len; i++)
		sum = (uint32_t)(sum + 0U + arr[i]);
	(*env)->ReleasePrimitiveArrayCritical(env, array, arr, 0);
	return (jint)sum;
}
