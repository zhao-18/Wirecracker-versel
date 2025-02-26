import Papa from 'papaparse';

const IDENTIFIER_LINE_2 = "### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###";

/**
 * Enum for different identifiers fr different pages
 * @readonly
 * @enum {string}
 */
export const Identifiers = Object.freeze({
    TEST_PLANNING:  "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR TEST PLANNING ###",
    LOCALIZATION:   "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR LOCALIZATION ###",
});

/**
 * Parses a CSV file and returns the parsed data.
 *
 * @param {File} file - The CSV file to be parsed.
 * @param {string|Identifiers} identifier - The identifier for the first line
 * @returns {Promise<Object[]>} A promise that resolves with parsed CSV data.
 */
export function parseCSVFile( file, identifier ) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file provided."));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result;
            const lines = fileContent.split(/\r?\n/);

            if (lines.length < 2 || lines[0].trim() !== identifier || lines[1].trim() !== IDENTIFIER_LINE_2) {
                reject(new Error("Invalid file. The first line must be the correct identifier."));
                return;
            }

            // Parse CSV content excluding the identifier line
            const csvWithoutIdentifier = lines.slice(2).join("\n");

            Papa.parse(csvWithoutIdentifier, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true, // Ensures correct data types for numbers
                complete: function (results) {
                    resolve(results.data);
                },
                error: function (err) {
                    reject(new Error("Parsing error: " + err.message));
                }
            });
        };

        reader.onerror = function () {
            reject(new Error("Error reading file."));
        };

        reader.readAsText(file);
    });
}
