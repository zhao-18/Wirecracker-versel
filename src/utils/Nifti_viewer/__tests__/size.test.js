import { size } from '../matlab_functions.js';

describe('size function', () => {
    test('size of a 1D array', () => {
        const input = [1, 2, 3, 4];
        const result = size(input);
        expect(result).toEqual([4]);  // A 1D array with 4 elements should return [4]
    });

    test('size of a 2D array', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6]
        ];
        const result = size(input);
        expect(result).toEqual([2, 3]);  // A 2x3 matrix should return [2, 3]
    });

    test('size of a 3D array', () => {
        const input = [
            [
                [1, 2],
                [3, 4]
            ],
            [
                [5, 6],
                [7, 8]
            ]
        ];
        const result = size(input);
        expect(result).toEqual([2, 2, 2]);  // A 2x2x2 3D array should return [2, 2, 2]
    });

    test('size of an empty array', () => {
        const input = [];
        const result = size(input);
        expect(result).toEqual([0]);  // An empty array should return [0]
    });

    test('non-array input', () => {
        const input = 42;
        const result = size(input);
        expect(result).toEqual([]);  // Non-array input should return an empty array
    });
});
