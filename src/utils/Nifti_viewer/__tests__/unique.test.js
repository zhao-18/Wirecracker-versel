import { unique } from "../matlab_functions.js";

describe("unique", () => {
    test("should return an empty array when given an empty array", () => {
        expect(unique([])).toEqual([]);
    });

    test("should return the same array if there are no duplicates", () => {
        expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
        expect(unique(["a", "b", "c"])).toEqual(["a", "b", "c"]);
    });

    test("should remove duplicate numbers", () => {
        expect(unique([1, 2, 2, 3, 4, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    });

    test("should remove duplicate strings", () => {
        expect(unique(["apple", "banana", "apple", "cherry", "banana"])).toEqual(["apple", "banana", "cherry"]);
    });

    test("should handle mixed data types", () => {
        expect(unique([1, "1", 2, "2", 2, "a", "a", true, false, true])).toEqual([1, "1", 2, "2", "a", true, false]);
    });

    test("should handle arrays with only duplicates", () => {
        expect(unique([5, 5, 5, 5, 5])).toEqual([5]);
    });
});
