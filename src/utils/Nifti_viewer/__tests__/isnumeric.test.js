import { isnumeric } from "../matlab_functions.js";

describe("isnumeric", () => {
    test("should return true for a single number and NaN (MatLab default)", () => {
        expect(isnumeric(42)).toBe(true);
        expect(isnumeric(-3.14)).toBe(true);
        expect(isnumeric(0)).toBe(true);
        expect(isnumeric(NaN)).toBe(true);
    });

    test("should return true for an array of numbers", () => {
        expect(isnumeric([1, 2, 3])).toBe(true);
        expect(isnumeric([0.1, 2.5, 3.7])).toBe(true);
        expect(isnumeric([-1, 0, 1])).toBe(true);
    });

    test("should return false for an array containing non-numeric values", () => {
        expect(isnumeric([1, "2", 3])).toBe(false);
        expect(isnumeric([true, 2, 3])).toBe(false);
        expect(isnumeric([null, 1, 2])).toBe(false);
        expect(isnumeric([{ num: 1 }, 2, 3])).toBe(false);
    });

    test("should return false for non-numeric types", () => {
        expect(isnumeric("123")).toBe(false);
        expect(isnumeric({})).toBe(false);
        expect(isnumeric(null)).toBe(false);
        expect(isnumeric(undefined)).toBe(false);
    });

    test("should return true for nested arrays of numbers", () => {
        expect(isnumeric([[1, 2], [3, 4]])).toBe(true);
        expect(isnumeric([[[1], 2], 3])).toBe(true);
    });

    test("should return false for nested arrays containing non-numeric values", () => {
        expect(isnumeric([[1, 2], ["3", 4]])).toBe(false);
        expect(isnumeric([[[1], "2"], 3])).toBe(false);
    });
});
