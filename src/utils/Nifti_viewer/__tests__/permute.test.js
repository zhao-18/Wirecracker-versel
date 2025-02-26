import { permute } from "../matlab_functions.js";

describe("permute", () => {
    test("should correctly swap two dimensions of a 2D array", () => {
        expect(permute(
            [[1, 2, 3], [4, 5, 6]],
            [1, 0]
        )).toEqual(
            [[1, 4], [2, 5], [3, 6]]
        );
    });

    test("should correctly permute a 3D array", () => {
        expect(permute(
            [[[1, 2], [3, 4]], [[5, 6], [7, 8]]],
            [2, 0, 1]
        )).toEqual(
            [[[1, 5], [2, 6]], [[3, 7], [4, 8]]]
        );
    });

    test("should return the same array if order is already correct", () => {
        expect(permute([[1, 2], [3, 4]], [0, 1])).toEqual([[1, 2], [3, 4]]);
    });

    test("should return the same array if order is empty", () => {
        expect(permute([[1, 2], [3, 4]], [])).toEqual([[1, 2], [3, 4]]);
    });

    test("should throw an error if order is invalid", () => {
        expect(() => permute([[1, 2], [3, 4]], [1, 1])).toThrow("ORDER cannot contain repeated permutation indices.");
        expect(() => permute([[1, 2], [3, 4]], [2, 0])).toThrow("ORDER contains an invalid permutation index.");
    });
});
