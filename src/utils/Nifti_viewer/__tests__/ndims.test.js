import { ndims } from '../matlab_functions.js';

describe('ndims function', () => {
    test('number of dimensions for a 1D array', () => {
        const input = [1, 2, 3, 4];
        const result = ndims(input);
        expect(result).toBe(2);  // 1D array should return 2 dimensions as per the function logic
    });

    test('number of dimensions for a 2D array', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6]
        ];
        const result = ndims(input);
        expect(result).toBe(2);  // 2D array should return 2 dimensions
    });

    test('number of dimensions for a 3D array', () => {
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
        const result = ndims(input);
        expect(result).toBe(3);  // 3D array should return 3 dimensions
    });

    test('number of dimensions for a 4D array', () => {
        const input = [
            [
                [
                    [1, 2],
                    [3, 4]
                ],
                [
                    [5, 6],
                    [7, 8]
                ]
            ]
        ];
        const result = ndims(input);
        expect(result).toBe(4);  // 4D array should return 4 dimensions
    });

    test('number of dimensions for an empty array', () => {
        const input = [];
        const result = ndims(input);
        expect(result).toBe(2);  // Empty array should return 2 dimensions
    });
});
