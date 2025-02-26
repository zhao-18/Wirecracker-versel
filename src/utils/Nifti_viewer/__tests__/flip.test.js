import { flip } from '../matlab_functions.js';

describe('flip function', () => {
    test('flips a 1D array', () => {
        const input = [1, 2, 3, 4];
        flip(input, 0);
        expect(input).toEqual([4, 3, 2, 1]);
    });

    test('flips a 2D array along rows', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6]
        ];
        flip(input, 1);
        expect(input).toEqual([
            [3, 2, 1],
            [6, 5, 4]
        ]);
    });

    test('flips a 2D array along columns', () => {
        const input = [
            [1, 2, 3],
            [4, 5, 6]
        ];
        flip(input, 0);
        expect(input).toEqual([
            [4, 5, 6],
            [1, 2, 3]
        ]);
    });

    test('flips a 3D array along the first dimension', () => {
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
        flip(input, 0);
        expect(input).toEqual([
            [
                [5, 6],
                [7, 8]
            ],
            [
                [1, 2],
                [3, 4]
            ]
        ]);
    });

    test('flips with invalid n (negative value)', () => {
        const input = [1, 2, 3];
        flip(input, -1);  // This should reverse the array since n is less than 0
        expect(input).toEqual([3, 2, 1]);
    });

    test('flips with n = 0 (reverse the whole array)', () => {
        const input = [1, 2, 3];
        flip(input, 0);  // This should reverse the array
        expect(input).toEqual([3, 2, 1]);
    });
});
