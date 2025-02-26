import { reshape } from "../matlab_functions.js";

describe("reshape", () => {
    test("should reshape a 1D array into a 2D array", () => {
        expect(reshape([1, 2, 3, 4], [2, 2])).toEqual([
            [1, 2],
            [3, 4]
        ]);
    });

    test("should reshape a 1D array into a 3D array", () => {
        expect(reshape([1, 2, 3, 4, 5, 6, 7, 8], [2, 2, 2])).toEqual([
            [
                [1, 2],
                [3, 4]
            ],
            [
                [5, 6],
                [7, 8]
            ]
        ]);
    });

    test("should return the same array if no reshaping is needed", () => {
        expect(reshape([1, 2, 3], [3])).toEqual([1, 2, 3]);
    });

    test("should throw an error if sizes do not match the number of elements", () => {
        expect(() => reshape([1, 2, 3, 4], [3, 2])).toThrow("Number of elements must not change. (4 => 6)");
    });
});
