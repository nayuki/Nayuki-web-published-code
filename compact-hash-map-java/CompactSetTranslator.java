/* 
 * Compact set translator
 * 
 * Copyright (c) 2015 Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/compact-hash-map-java
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */


/**
 * A function class that serializes/deserializes Java objects for storage in
 * compact sets. Instances of translators should be stateless and immutable.
 * <p>The objects being stored must be numbers, strings, or compositions thereof.
 * Objects like I/O streams, GUI widgets, network sockets generally cannot be stored.</p>
 */
public interface CompactSetTranslator<E> {
	
	/**
	 * Tests whether the specified object is an instance of the element class {@code E}.
	 * This method exists because {@code contains()} and {@code remove()} take an {@code Object} argument.
	 * This must return {@code false} on {@code null}, not throw an exception.
	 * @return whether the object is an instance of the element class {@code E}
	 */
	public boolean isInstance(Object obj);
	
	
	/**
	 * Returns the hash code of the specified object. The method exists to make it easy to
	 * sidestep poorly distributed hash functions, such as the one in {@code String.hashCode()}.
	 * <p>This method must be consistent with the behavior of {@code equals()} - in other words,
	 * {@code x.equals(y)} implies {@code translator.getHash(x) == translator.getHash(y)}.</p>
	 * <p></p>
	 * @param obj the object to hash
	 * @return the hash code of the object
	 * @throws NullPointerException if the object is {@code null}
	 */
	public int getHash(E obj);
	
	
	/**
	 * Returns a serialized version of the specified object as a byte array.
	 * The object must be non-{@code null}.
	 * @param obj the object to serialize
	 * @return the object packed as a byte array
	 * @throws NullPointerException if the object is {@code null}
	 */
	public byte[] serialize(E obj);
	
	
	/**
	 * Returns a copy of the original object by deserializing the specified packed array.
	 * <p>The result is non-{@code null}. Note that the returned object must be {@code equal()}
	 * to the object that was stored, but it does not necessarily refer to the same object.</p>
	 * @param packed the packed object byte array
	 * @return a copy of the original object, which is not {@code null}
	 */
	public E deserialize(byte[] packed);
	
}
