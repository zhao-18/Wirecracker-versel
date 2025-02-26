import { diag } from '../matlab_functions.js';

describe('diag function', () => {
    test('create diagonal matrix from a vector', () => {
        const input = [1, 2, 3];
        const result = diag(input);
        expect(result).toEqual([
            [1, 0, 0],
            [0, 2, 0],
            [0, 0, 3]
        ]);  // Diagonal matrix with input vector on the diagonal
    });

    test('create diagonal matrix from an empty vector', () => {
        const input = [];
        const result = diag(input);
        expect(result).toEqual([]);  // Empty input should return an empty matrix
    });

    test('create diagonal matrix from a single-element vector', () => {
        const input = [5];
        const result = diag(input);
        expect(result).toEqual([[5]]);  // 1x1 matrix with the single value
    });

    test('create diagonal matrix from a vector with negative values', () => {
        const input = [-1, -2, -3];
        const result = diag(input);
        expect(result).toEqual([
            [-1, 0, 0],
            [0, -2, 0],
            [0, 0, -3]
        ]);  // Diagonal matrix with negative values on the diagonal
    });
});
