import { transpose } from "../matlab_functions.js";

describe("transpose", () => {
    test("should transpose a square matrix", () => {
        expect(transpose([[1, 2], [3, 4]])).toEqual([[1, 3], [2, 4]]);
    });

    test("should transpose a rectangular matrix", () => {
        expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    test("should return the same array if input is a 1D vector", () => {
        expect(transpose([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test("should handle empty arrays", () => {
        expect(transpose([])).toEqual([]);
    });

    test("should handle single element arrays", () => {
        expect(transpose([[1]])).toEqual([[1]]);
    });
});
