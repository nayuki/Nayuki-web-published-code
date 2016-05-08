/* 
 * Create map (Java version)
 * 
 * Copyright (c) 2016 Project Nayuki
 * All rights reserved. Contact Nayuki for licensing.
 * https://www.nayuki.io/page/java-native-interface-compared-to-python-c-api
 */

#include <jni.h>
#include <stddef.h>
#include <stdlib.h>
#include <string.h>


JNIEXPORT jobject JNICALL Java_CreateMap_createMap(JNIEnv *env, jclass createMapClass, jint num) {
	// Get HashMap methods
	jclass hashMapClass   = (*env)->FindClass(env, "java/util/HashMap");
	jmethodID hashMapCtor = (*env)->GetMethodID(env, hashMapClass, "<init>", "()V");
	jmethodID hashMapPut  = (*env)->GetMethodID(env, hashMapClass, "put", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;");
	jmethodID hashMapSize = (*env)->GetMethodID(env, hashMapClass, "size", "()I");
	
	// Get miscellaneous methods
	jclass integerClass = (*env)->FindClass(env, "java/lang/Integer");
	jmethodID integerValueOf = (*env)->GetStaticMethodID(env, integerClass, "valueOf", "(I)Ljava/lang/Integer;");
	jmethodID createMapIsPrime = (*env)->GetStaticMethodID(env, createMapClass, "isPrime", "(I)Z");
	
	// Initialize variables
	jobject result = (*env)->NewObject(env, hashMapClass, hashMapCtor);
	size_t scap = 1;
	char *s = malloc(scap * sizeof(char));
	memset(s, 0, scap * sizeof(char));
	jint i = 1;
	int c = 0;
	
	// Add entries to map
	while ((*env)->CallIntMethod(env, result, hashMapSize) < num) {
		jboolean isPrimeResult = (*env)->CallStaticBooleanMethod(env, createMapClass, createMapIsPrime, i);
		if (isPrimeResult) {
			jobject keyObj = (*env)->CallStaticObjectMethod(env, integerClass, integerValueOf, i);
			jstring valObj = (*env)->NewStringUTF(env, s);
			(*env)->CallObjectMethod(env, result, hashMapPut, keyObj, valObj);
			(*env)->DeleteLocalRef(env, keyObj);
			(*env)->DeleteLocalRef(env, valObj);
			memset(s, 0, scap * sizeof(char));
		}
		
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
	return result;
}
