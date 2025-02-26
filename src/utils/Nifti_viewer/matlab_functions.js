//   _    _ _                              _
//  | |  | (_)                            | |
//  | |  | |_ _ __ ___  ___ _ __ __ _  ___| | _____ _ __
//  | |/\| | | '__/ _ \/ __| '__/ _` |/ __| |/ / _ \ '__|
//  \  /\  / | | |  __/ (__| | | (_| | (__|   <  __/ |
//   \/  \/|_|_|  \___|\___|_|  \__,_|\___|_|\_\___|_|
//
//
//  Collection of matlab function ported into javascript.
//  The functions here does not have original algorithm.
//
//  This file contains:
//
//  @function isnumeric
//  @function unique
//  @function sub2ind
//  @function reshape
//  @function isequal
//  @function permute
//  @function transpose
//  @function flip
//  @function prod
//  @function size
//  @function ndims
//  @function find
//  @function det
//  @function diag
//  @function bitset
//  @function inv
//
//  Developed by Wirecracker team and distributed under MIT license.

/*
 * Determine whether input is numeric array
 *
 * @param {Object|Object[]} value  -  Input array or value
 *
 * @returns {boolean}  true if A is an array of numeric data type. Otherwise, it returns false.
 */
export function isnumeric ( value )
{
    if ( typeof value === 'number' )
    {
        return true;
    }
    else if ( Array.isArray(value) )
    {
        for (const element of value)
        {
            if ( !isnumeric(element) )
            {
                return false;
            }
        }
        return true;
    }
    return false;
}

/*
 * Given an array, return an array that does not contain any duplicates
 * Only tested with single dimensional array
 *
 * @param {Object[]} array  -  Input array
 *
 * @returns {Object[]}  Array with the same data as in A, but with no repetitions.
 */
export function unique(array)
{
    return [...new Set(array)];
}

/*
 * Convert subscripts to linear indices
 *
 * @param {integer[]} sizes  -  Size of array, specified as a vector of positive integers.
 * Each element of this vector indicates the size of the corresponding dimension.
 *
 * @param {integer I1, I2, ..., In}  -  Multidimensional subscripts, specified in scalars.
 *
 * @returns {integer}  Linear index, returned as a scalar
 */
export function sub2ind(sizes, ...subs)
{
    let index = 0;
    let multiplier = 1;

    if (subs.length !== sizes.length)
    {
        throw new Error("Number of subscripts must match number of dimensions");
    }

    for (let i = 0; i < subs.length; i++)
    {
        if (subs[i] < 0 || subs[i] >= sizes[i])
        {
            throw new Error(`Subscript ${subs[i]} is out of bounds for dimension ${i}`);
        }
        index += subs[i] * multiplier;
        multiplier *= sizes[i];
    }
    return index;
}


/*
 * Reshape array by rearranging existing elements
 *
 * @param {Array} array  -  Input array, specified as a vector, matrix, or multidimensional array.
 * @param {integer[]} sizes  -  Output size, specified as a row vector of integers. Each element of
 * sizes indicates the size of the corresponding dimension in output. You must specify the size so
 * that the number of elements in input array and output array are the same. That is, prod(sizes) must
 * be the same as number_of_elements(input).
 *
 * @returns {Array}  Reshaped array, returned as a vector, matrix, multidimensional array. The data
 * type and number of elements in output are the same as the data type and number of elements in input.
 */
export function reshape (array, sizes)
{
    let matlabDim = sizes.reverse();
    let tmp = structuredClone(array).flat(Infinity);
    if ( prod(sizes) !== prod(size(tmp)) )
        throw new Error(`Number of elements must not change. (${prod(size(tmp))} => ${prod(sizes)})`);

    let tmpArray2;
    // for each dimensions starting by the last one and ignoring the first one
    for (let sizeIndex = matlabDim.length - 1; sizeIndex > 0; sizeIndex--)
    {
        const size = matlabDim[sizeIndex];
        tmpArray2 = [];

        // aggregate the elements of the current tmpArray in elements of the requested size
        const length = tmp.length / size;
        for (let i = 0; i < length; i++)
        {
            tmpArray2.push(tmp.slice(i * size, (i + 1) * size));
        }
        // set it as the new tmpArray for the next loop turn or for return
        tmp = tmpArray2;
    }

    return tmp;
}

/*
 * Determine array equality
 *
 * @param {Array} array1  -  Input to be compared
 * @param {Array} array1  -  Input to be compared
 *
 * @returns {boolean}  true if array1 and array2 are equivalent; otherwise, it returns false.
 */
export function isequal ( array1, array2 )
{
    if (!array1 || !array2)
        return false;

    if ( array1 === array2 )
        return true;

    if ( array1.length != array2.length )
        return false;

    for (var i = 0, l=array1.length; i < l; i++) {
        if (array1[i] instanceof Array && array2[i] instanceof Array) {
            if (!isequal(array1[i], array2[i]))
                return false;
        }
        else if (array1[i] != array2[i]) {
            return false;
        }
    }
    return true;
}

/*
 * Permute array dimentions
 *
 * @param {Array} array  -  Input array, specified as a vector, matrix, or multidimensional array.
 * @param {integer[]} order  -  Dimension order, specified as a row vector with unique,
 * positive integer elements that represent the dimensions of the input array.
 *
 * @returns {Array}  Input array with the dimensions rearranged in the order specified by the vector
 * dimorder. For example, permute(A,[1,0]) switches the row and column dimensions of a matrix A. In general,
 * the ith dimension of the output array is the dimension dimorder(i) from the input array.
 */
export function permute(array, order) {
    if (unique(order).length != order.length)
        throw new Error("ORDER cannot contain repeated permutation indices.");

    let check = structuredClone(order).sort();
    if (!isequal(check, Array.from(Array(check.length).keys())))
        throw new Error("ORDER contains an invalid permutation index.");

    let tmp = structuredClone(array);
    for (var i = 0; i < order.length; i++) {

        // Last i elements are already in place
        for (var j = 0; j < (order.length - i - 1); j++) {
            // Checking if the item at present iteration
            // is greater than the next iteration
            if (order[j] > order[j + 1]) {

                // If the condition is true
                // then swap them

                // transpose dimension j
                tmp = transpose_nth_dim(tmp, j);

                [order[j], order[j + 1]] = [order[j + 1], order[j]];
            }
        }
    }

    return tmp;
}

function transpose_nth_dim ( arr, n ) {
    if ( n == 0 )
    {
        arr = transpose(arr);
    }
    else if ( n == 1 )
    {
        for ( let i = 0; i < arr.length; i++ )
        {
            arr[i] = transpose(arr[i]);
        }
    }
    else
    {
        for ( let i = 0; i < arr.length; i++ )
        {
            arr[i] = transpose_nth_dim(arr[i], n - 1);
        }
    }
    return arr;
}

/*
 * Transpose vector or matrix
 *
 * @param {Array} arr  -  Input array, specified as a vector or matrix.
 *
 * @returns {Array}  the nonconjugate transpose of input array, that is,
 * interchanges the row and column index for each element.
 */
export function transpose(arr) {
    let rows = arr.length;
    if (!Array.isArray(arr[0])) return arr;
    let cols = arr[0].length;

    // Initialize transposed array
    let transposed = Array.from({ length: cols }, () => Array(rows).fill(0));

    // Swap rows and columns
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            transposed[j][i] = arr[i][j];
        }
    }

    return transposed;
}

/*
 * Flip order of elements
 * CAUTION destructive
 *
 * @param {Array} array  -  Input array, specified as a vector, matrix, or multidimensional array.
 * @param {integer} n  -  Dimension to operate along, specified as a positive integer scalar.
 *
 * @returns {Array}  array with the same size as input, but with the order of the elements at n-th dimension reversed.
 */
export function flip( array, n )
{
    if (!Array.isArray(array))
        return;

    if ( n <= 0 )
    {
        array.reverse();
    }
    else
    {
        for (let item of array)
        {
            flip(item, n - 1);
        }
    }
}

/*
 * Product of array elements
 *
 * @param {number[]} array  -  Input array, specified as a one dimensional array.
 *
 * @returns {number}  product of the array elements of input.
 */
export function prod(array) {
    return array.reduce((acc, num) => acc * num, 1);
}

/*
 * Array size
 *
 * @param {Array} array  -  Input array, specified as a scalar, a vector, a matrix, or a multidimensional array.
 *
 * @returns {number[]}  a row vector whose elements are the lengths of the corresponding dimensions of input.
 */
export function size(array) {
    let dimension = [];
    while (Array.isArray(array)) {
        dimension.push(array.length);
        array = array[0];
    }
    return dimension;
}

/*
 * Number of array dimensions
 *
 * @param {Array} array  -  Input array, specified as a scalar, a vector, a matrix, or a multidimensional array.
 *
 * @returns {number[]}  the number of dimensions in the input array. The number of dimensions is always greater than or equal to 2.
 */
export function ndims(array) {
    let ndim = size(array).length;

    if (ndim <= 2)
        return 2;

    return ndim;
}

/*
 * Find indices and values of nonzero elements
 *
 * @param {Array} array  -  Input array, specified as a scalar, vector, matrix, or multidimensional array.
 *
 * @returns {number[]}  a vector containing the linear indices of each nonzero element in array X.
 */
export function find(X) {
    let indices = [];
    let dimension = size(X);

    function traverse(array, path = [], linearIdx = 0) {
        if (!Array.isArray(array)) {
            if (array !== 0) indices.push(linearIdx); // Store linear index if nonzero
            return linearIdx + 1; // Increment linear index
        }
        return array.reduce((linIdx, val, i) => traverse(val, [...path, i], linIdx), linearIdx);
    }

    traverse(X);

    // Preserve row/column orientation for vectors
    if (dimension.length === 1) return dimension[0] === indices.length ? indices : indices.flat();
    return indices; // Return as column vector for multi-dimensional arrays
}

/*
 * Matrix determinant
 *
 * @param {number[]} array  -  Input matrix, specified as a square numeric matrix.
 *
 * @returns {number}  the determinant of square matrix.
 */
export function det(matrix) {
    let n = matrix.length;

    // Base case: 1x1 matrix
    if (n === 1) return matrix[0][0];

    // Base case: 2x2 matrix
    if (n === 2) {
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    let determinant = 0;

    // Expanding along the first row
    for (let j = 0; j < n; j++) {
        let subMatrix = matrix.slice(1).map(row => row.filter((_, col) => col !== j));
        determinant += ((j % 2 === 0 ? 1 : -1) * matrix[0][j] * det(subMatrix));
    }

    return determinant;
}

/*
 * Create diagonal matrix or get diagonal elements of matrix
 *
 * @param {number[]} values  -  Diagonal elements, specified as a vector.
 *
 * @returns {number[number[]]}  a square diagonal matrix with the elements of vector v on the main diagonal.
 */
export function diag(values) {
    // Create a square matrix of size values.length x values.length filled with zeros
    let matrix = Array(values.length).fill().map(() => Array(values.length).fill(0));

    // Place the values in the diagonal of the matrix
    for (let i = 0; i < values.length; i++) {
        matrix[i][i] = values[i];  // Set diagonal elements
    }

    return matrix;
}

/*
 * Set bit at specific location
 *
 * @param {number[]} value  -  Input value, specified as an scalar.
 * @param {integer} position  -  Bit position, specified as an integer.
 * @param {0|1} bit  -  Bit value, specified as a integer.
 *
 * @returns {number[number[]]}  'value' with 'position' bit set to the value of 'bit'.
 */
export function bitset(value, position, bit) {
    if (bit === 1) {
        return value | (1 << position); // Set the bit to 1
    } else {
        return value & ~(1 << position); // Set the bit to 0
    }
}

/*
 * Matrix inverse
 * @see {http://web.archive.org/web/20210406035905/http://blog.acipo.com/matrix-inversion-in-javascript/}
 *
 * @param {number[number[]]} matrix  -  Input matrix, specified as a square matrix.
 *
 * @returns {number[number[]]}  inverse of input matrix.
 */
export function inv (matrix) {
    if (matrix.length !== matrix[0].length) { return; }
    var i = 0, ii = 0, j = 0, dim = matrix.length, e = 0;
    var I = [], C = [];
    for (i = 0; i < dim; i += 1) {
        I[I.length] = [];
        C[C.length] = [];
        for (j = 0; j < dim; j += 1) {
            if (i == j) { I[i][j] = 1; }
            else { I[i][j] = 0; }
            C[i][j] = matrix[i][j];
        }
    }
    for (i = 0; i < dim; i += 1) {
        e = C[i][i];
        if (e == 0) {
            for (ii = i + 1; ii < dim; ii += 1) {
                if (C[ii][i] != 0) {
                    for (j = 0; j < dim; j++) {
                        e = C[i][j];
                        C[i][j] = C[ii][j];
                        C[ii][j] = e;
                        e = I[i][j];
                        I[i][j] = I[ii][j];
                        I[ii][j] = e;
                    }
                    break;
                }
            }
            e = C[i][i];
            if (e == 0) { return }
        }
        for (j = 0; j < dim; j++) {
            C[i][j] = C[i][j] / e; //apply to original matrix
            I[i][j] = I[i][j] / e; //apply to identity
        }
        for (ii = 0; ii < dim; ii++) {
            if (ii == i) { continue; }
            e = C[ii][i];
            for (j = 0; j < dim; j++) {
                C[ii][j] -= e * C[i][j]; //apply to original matrix
                I[ii][j] -= e * I[i][j]; //apply to identity
            }
        }
    }
    return I;
}
