import { bitset } from '../matlab_functions.js';

describe('bitset function', () => {
    test('set bit to 1 at specified position', () => {
        const value = 5;  // In binary: 101
        const position = 1;
        const bit = 1;
        const result = bitset(value, position, bit);
        expect(result).toBe(7);  // In binary: 111 (position 1 set to 1)
    });

    test('set bit to 0 at specified position', () => {
        const value = 5;  // In binary: 101
        const position = 2;
        const bit = 0;
        const result = bitset(value, position, bit);
        expect(result).toBe(1);  // In binary: 001 (position 2 set to 0)
    });

    test('set bit to 1 when bit is already 1', () => {
        const value = 7;  // In binary: 111
        const position = 0;
        const bit = 1;
        const result = bitset(value, position, bit);
        expect(result).toBe(7);  // Bit is already 1 at position 0
    });

    test('set a specific bit in a number with multiple bits set', () => {
        const value = 12;  // In binary: 1100
        const position = 2;
        const bit = 0;
        const result = bitset(value, position, bit);
        expect(result).toBe(8);  // In binary: 1000 (position 1 set to 0)
    });

    test('set the least significant bit (position 0)', () => {
        const value = 4;  // In binary: 100
        const position = 0;
        const bit = 1;
        const result = bitset(value, position, bit);
        expect(result).toBe(5);  // In binary: 101 (position 0 set to 1)
    });

    test('set the most significant bit (position 31)', () => {
        const value = 0;  // In binary: 00000000000000000000000000000000
        const position = 30;
        const bit = 1;
        const result = bitset(value, position, bit);
        expect(result).toBe(Math.pow(2, 30));  // Set the 30st bit (1 << 30)
    });
});
