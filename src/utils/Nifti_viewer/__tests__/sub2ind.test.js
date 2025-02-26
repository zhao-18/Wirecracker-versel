import { sub2ind } from "../matlab_functions.js";

describe("sub2ind", () => {
    test("should return correct linear index for 2D array", () => {
        expect(sub2ind([3, 3], 0, 0)).toBe(0);
        expect(sub2ind([3, 3], 1, 1)).toBe(4);
        expect(sub2ind([3, 3], 2, 2)).toBe(8);
    });

    test("should return correct linear index for 3D array", () => {
        expect(sub2ind([3, 3, 3], 0, 0, 0)).toBe(0);
        expect(sub2ind([3, 3, 3], 1, 1, 1)).toBe(13);
        expect(sub2ind([3, 3, 3], 2, 2, 2)).toBe(26);
    });

    test("should throw an error if subscripts are out of bounds", () => {
        expect(() => sub2ind([3, 3], 3, 0)).toThrow("Subscript 3 is out of bounds for dimension 0");
        expect(() => sub2ind([3, 3, 3], -1, 0, 0)).toThrow("Subscript -1 is out of bounds for dimension 0");
        expect(() => sub2ind([2, 2], 1, 2)).toThrow("Subscript 2 is out of bounds for dimension 1");
    });

    test("should throw an error if number of subscripts does not match number of dimensions", () => {
        expect(() => sub2ind([3, 3], 1)).toThrow("Number of subscripts must match number of dimensions");
        expect(() => sub2ind([3, 3, 3], 1, 2)).toThrow("Number of subscripts must match number of dimensions");
    });
});
