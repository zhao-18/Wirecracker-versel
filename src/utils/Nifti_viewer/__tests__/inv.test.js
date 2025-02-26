import { inv } from '../matlab_functions.js';

describe('inv function', () => {
    test('inverse of a 2x2 matrix', () => {
        const matrix = [
            [4, 7],
            [2, 6]
        ];
        const result = inv(matrix);
        const expected = [
            [0.6, -0.7],
            [-0.2, 0.4]
        ];

        // Loop through each row
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result[i].length; j++) {
                expect(result[i][j]).toBeCloseTo(expected[i][j], 15);  // Allow small precision difference
            }
        }
    });

    test('inverse of a 3x3 matrix', () => {
        const matrix = [
            [1, 2, 3],
            [0, 1, 4],
            [5, 6, 0]
        ];
        const result = inv(matrix);
        const expected = [
            [-24,  18,  5],
            [ 20, -15, -4],
            [ -5,   4,  1]
        ];

        // Loop through each row
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result[i].length; j++) {
                expect(result[i][j]).toBeCloseTo(expected[i][j], 15);  // Allow small precision difference
            }
        }
    });

    test('inverse of a singular matrix', () => {
        const matrix = [
            [1, 2],
            [2, 4]
        ];
        const result = inv(matrix);
        expect(result).toBeUndefined();  // Singular matrix, should return undefined (no inverse)
    });

    test('inverse of an identity matrix', () => {
        const matrix = [
            [1, 0],
            [0, 1]
        ];
        const result = inv(matrix);
        const expected = [
            [1, 0],
            [0, 1]
        ];
        expect(result).toEqual(expected);  // Inverse of identity matrix is identity matrix
    });

    test('inverse of a matrix with negative elements', () => {
        const matrix = [
            [-1, -2],
            [-3, -4]
        ];
        const result = inv(matrix);
        const expected = [
            [   2,  -1],
            [-1.5, 0.5]
        ];

        // Loop through each row
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < result[i].length; j++) {
                expect(result[i][j]).toBeCloseTo(expected[i][j], 15);  // Allow small precision difference
            }
        }
    });
});
