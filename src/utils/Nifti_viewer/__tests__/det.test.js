import { det } from '../matlab_functions.js';

describe('det function', () => {

    test('determinant of a 1x1 matrix', () => {
        const input = [[5]];
        const result = det(input);
        expect(result).toBe(5);  // A 1x1 matrix's determinant is the value itself
    });

    test('determinant of a 2x2 matrix', () => {
        const input = [
            [1, 2],
            [3, 4]
        ];
        const result = det(input);
        expect(result).toBe(-2);  // Determinant is (1 * 4) - (2 * 3) = -2
    });

    test('determinant of a 3x3 matrix', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        const result = det(input);
        expect(result).toBe(0);  // The determinant of this matrix is 0
    });

    test('determinant of a 4x4 matrix', () => {
        const input = [
            [1, 0, 0, 0],
            [0, 2, 0, 0],
            [0, 0, 3, 0],
            [0, 0, 0, 4]
        ];
        const result = det(input);
        expect(result).toBe(24);  // Determinant of a diagonal matrix is the product of diagonal elements: 1 * 2 * 3 * 4 = 24
    });

    test('determinant of a matrix with all zeros', () => {
        const input = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        const result = det(input);
        expect(result).toBe(0);  // The determinant of a matrix with all zeros is 0
    });

    test('determinant of a matrix with mixed positive and negative numbers', () => {
        const input = [
            [1, 2, 3],
            [0, 1, 4],
            [5, 6, 0]
        ];
        const result = det(input);
        expect(result).toBe(1);
    });

});
