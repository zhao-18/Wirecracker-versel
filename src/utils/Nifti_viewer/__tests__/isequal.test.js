import { isequal } from "../matlab_functions.js";

describe("isequal", () => {
    test("should return true for identical arrays", () => {
        expect(isequal([1, 2, 3], [1, 2, 3])).toBe(true);
        expect(isequal([], [])).toBe(true);
    });

    test("should return false for arrays with different lengths", () => {
        expect(isequal([1, 2, 3], [1, 2])).toBe(false);
    });

    test("should return false for arrays with different elements", () => {
        expect(isequal([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    test("should return true for nested identical arrays", () => {
        expect(isequal([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
    });

    test("should return false for nested arrays with different elements", () => {
        expect(isequal([[1, 2], [3, 5]], [[1, 2], [3, 4]])).toBe(false);
    });

    test("should return false if either input is null or undefined", () => {
        expect(isequal(null, [1, 2, 3])).toBe(false);
        expect(isequal([1, 2, 3], undefined)).toBe(false);
    });
});
