import Papa from 'papaparse';
import contact from '../pages/ContactDesignation/contact';

const IDENTIFIER_LINE_2 = "### THESE TWO LINES SERVES AS IDENTIFIER. DO NOT DELETE ###";

/**
 * Enum for different identifiers fr different pages
 * @readonly
 * @enum {string}
 */
export const Identifiers = Object.freeze({
    TEST_PLANNING:           "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR TEST PLANNING ###",
    LOCALIZATION:            "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR LOCALIZATION ###",
    DESIGNATION:             "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR DESIGNATION ###",
    STIMULATION:             "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR CCEPS / SEIZURE RECREATION PLANNING ###",
    STIMULATION_FUNCTION:    "### THIS CSV IS INTENDED TO BE USED AT WIRECRACKER.COM FOR FUNCTIONAL MAPPING PLANNING ###",
});

/**
 * Parses a CSV file and returns the parsed data.
 *
 * @param {File} file - The CSV file to be parsed.
 * @returns {Promise<{ identifier: string, data: Object }>} A promise that resolves with the identifier and parsed CSV data.
 */
export function parseCSVFile( file, coordinates = false ) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file provided."));
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            const fileContent = e.target.result;
            const lines = fileContent.split(/\r?\n/);

            if (!coordinates && (lines.length < 2 ||
                (
                    lines[0].trim() !== Identifiers.TEST_PLANNING &&
                    lines[0].trim() !== Identifiers.LOCALIZATION &&
                    lines[0].trim() !== Identifiers.DESIGNATION &&
                    lines[0].trim() !== Identifiers.STIMULATION &&
                    lines[0].trim() !== Identifiers.STIMULATION_FUNCTION
                ) || lines[1].trim() !== IDENTIFIER_LINE_2 )) {
                reject(new Error("Invalid file. The first line must be the correct identifier."));
                return;
            }

            let identifier;
            let csvWithoutIdentifier;
            if (!coordinates) { 
                identifier = lines[0].trim();
                // Parse CSV content excluding the identifier line
                csvWithoutIdentifier = lines.slice(2).join("\n");
            } else {
                identifier = "coordinates";
                csvWithoutIdentifier = lines.join("\n");
            }

            if (identifier === Identifiers.LOCALIZATION) {
                resolve({ identifier, data: parseLocalization(csvWithoutIdentifier) });
                return;
            }
            else if (identifier === Identifiers.DESIGNATION) {
                // First parse as localization to get the original structure
                const localizationData = parseLocalization(csvWithoutIdentifier);
                // Then parse as designation for the current state
                const designationData = parseDesignation(csvWithoutIdentifier);
                resolve({ 
                    identifier, 
                    data: {
                        originalData: localizationData,
                        data: designationData
                    }
                });
                return;
            }
            else if (identifier === Identifiers.STIMULATION || identifier === Identifiers.STIMULATION_FUNCTION) {
                // const designationData = parseDesignation(csvWithoutIdentifier);
                const stimulationData = parseStimulation(csvWithoutIdentifier);
                resolve({identifier, data: stimulationData, isFunctionalMapping: identifier === Identifiers.STIMULATION_FUNCTION});
                return;
            }
            else if (identifier === Identifiers.TEST_PLANNING) {
                resolve({ identifier, data: parseTests(csvWithoutIdentifier) });
                return;
            }

            Papa.parse(csvWithoutIdentifier, {
                header: true,
                comments: "#",
                skipEmptyLines: true,
                dynamicTyping: true, // Ensures correct data types for numbers
                complete: function (results) {
                    resolve({ identifier, data: results.data });
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

/**
 * Parses localization CSV data into a nested dictionary format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A nested dictionary with the format { Label: { ContactNumber: {"electrodeDescription": "Left Entorhinal", "contactDescription": "Left Entorhinal", "associatedLocation": "GM"}, ... }, ... }
 */
function parseLocalization(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = row.ContactNumber.trim();
        const electrodeDescription = row.ElectrodeDescription.trim();
        const contactDescription = row.ContactDescription.trim();
        const associatedLocation = row.AssociatedLocation.trim();
        
        if (!parsedData[label]) {
            parsedData[label] = { 'description' : electrodeDescription };
        }
        parsedData[label][contactNumber] = {
            contactDescription,
            associatedLocation
        };
    });
    
    return parsedData;
}

/**
 * Parses designation CSV data into a data structure format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseDesignation(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
    
    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = parseInt(row.ContactNumber);
        let associatedLocation = row.AssociatedLocation.trim();
        const contactDescription = row.ContactDescription.trim();
        const electrodeDescription = row.ElectrodeDescription.trim();
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified
        const surgeonMark = parseInt(row.SurgeonMark) === 1; // Convert to boolean from int (0 or 1)
        
        // Process associated location based on GM presence
        if (associatedLocation === 'GM') {
            associatedLocation = contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            associatedLocation = `${contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactDescription.split('+');
            associatedLocation = `${desc1}/${desc2}`;
        }
        // For other cases (like WM), keep the original associatedLocation
        
        if (!parsedData[label]) {
            parsedData[label] = {
                label: label,
                contacts: []
            };
        }
        
        const contactObj = {
            ...(new contact(associatedLocation, mark, surgeonMark)),
            index: contactNumber,
            __electrodeDescription__: electrodeDescription,
            __contactDescription__: contactDescription,
        };
        
        // Add to contacts array at the correct index (contactNumber - 1)
        // Ensure the array is large enough
        while (parsedData[label].contacts.length < contactNumber) {
            parsedData[label].contacts.push(null);
        }
        parsedData[label].contacts[contactNumber - 1] = contactObj;
    });
    
    // Convert to array format matching demo data
    return Object.values(parsedData).map(electrode => ({
        label: electrode.label,
        contacts: electrode.contacts.filter(contact => contact !== null) // Remove any null entries
    }));
}

/**
 * Parses stimulation CSV data into a data structure format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseStimulation(csvData) {
    const parsedData = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;

    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = parseInt(row.ContactNumber);
        let associatedLocation = row.AssociatedLocation.trim();
        const contactDescription = row.ContactDescription.trim();
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified)
        const surgeonMark = row.SurgeonMark.trim() === "true"; // Convert to boolean
        const pair = parseInt(row.Pair);
        const isPlanning = row.IsPlanning.trim() === "true";
        const electrodeDescription = row.ElectrodeDescription.trim();
        const frequency = parseFloat(row.Frequency) || 105; // TODO : ask what default value should be
        const duration = parseFloat(row.Duration) || 3.0;
        const current = parseFloat(row.Current) || 2.445;

        // Process associated location based on GM presence
        if (associatedLocation === 'GM') {
            associatedLocation = contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            associatedLocation = `${contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactDescription.split('+');
            associatedLocation = `${desc1}/${desc2}`;
        }
        // For other cases (like WM), keep the original associatedLocation

        if (!parsedData[label]) {
            parsedData[label] = {
                label: label,
                contacts: []
            };
        }

        const contactObj = {
            ...(new contact(associatedLocation, mark, surgeonMark)),
            __electrodeDescription__: electrodeDescription,
            __contactDescription__: contactDescription,
            index: contactNumber,
            pair: pair,
            isPlanning: isPlanning,
            duration: duration,
            frequency: frequency,
            current: current,
        };

        if (isPlanning) {
            contactObj.order = parseInt(row.PlanOrder);
            if (contactObj.order < 0) {
                alert("error found on csv. Contact(s) will be missing from planning pane.");
                contactObj.isPlanning = false;
            }
        }

        // Add to contacts array at the correct index (contactNumber - 1)
        // Ensure the array is large enough
        while (parsedData[label].contacts.length < contactNumber) {
            parsedData[label].contacts.push(null);
        }
        parsedData[label].contacts[contactNumber - 1] = contactObj;
    });

    // Convert to array format matching demo data
    return Object.values(parsedData).map(electrode => ({
        label: electrode.label,
        contacts: electrode.contacts.filter(contact => contact !== null) // Remove any null entries
    }));
}

/**
 * Parses stimulation CSV data into a data structure format.
 *
 * @param {Object[]} data - Parsed CSV data from PapaParse
 * @returns {Object} A data structure with the format [{ label: 'A'', contacts: [contact, contact, ...] }, ... ]
 */
function parseTests(csvData) {
    const contacts = [];
    const tests = {};
    const rows = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;

    // First pass: Group by electrode label and collect contacts
    rows.forEach(row => {
        const label = row.Label.trim();
        const contactNumber = parseInt(row.ContactNumber);
        let associatedLocation = row.AssociatedLocation.trim();
        const contactDescription = row.ContactDescription.trim();
        const mark = parseInt(row.Mark) || 0; // Default to 0 if not specified
        const surgeonMark = row.SurgeonMark.trim() === "true"; // Convert to boolean
        const pair = parseInt(row.Pair);
        const electrodeDescription = row.ElectrodeDescription.trim();
        const frequency = parseFloat(row.Frequency) || 105; // TODO : ask what default value should be
        const duration = parseFloat(row.Duration) || 3.0;
        const current = parseFloat(row.Current) || 2.445;
        const testID = row.TestID.trim();

        // Process associated location based on GM presence
        if (associatedLocation === 'GM') {
            associatedLocation = contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            associatedLocation = `${contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactDescription.split('+');
            associatedLocation = `${desc1}/${desc2}`;
        }
        // For other cases (like WM), keep the original associatedLocation

        const contactObj = {
            ...(new contact(associatedLocation, mark, surgeonMark)),
            __electrodeDescription__: electrodeDescription,
            __contactDescription__: contactDescription,
            id: label + contactNumber,
            electrodeLabel: label,
            index: contactNumber,
            pair: pair,
            duration: duration,
            frequency: frequency,
            current: current,
        };

        // Add contact if it doesn't already exist
        if (!contacts.some(c => c.id === contactObj.id)) {
            contacts.push(contactObj);
        }

        // Add test ID to the contact's test list
        if (testID !== "") {
            if (!tests[contactObj.id]) {
                tests[contactObj.id] = [];
            }
            tests[contactObj.id].push({id: parseInt(testID)});
        }
    });

    // Convert to array format matching demo data
    return {contacts: contacts, tests: tests};
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 * 
 * @param {string} identifier - The identifier for the first line.
 * @param {Object} data - The data to be saved.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {Object|void} The parsed data if download is false, otherwise void.
 */
export function saveCSVFile(identifier, data, download = true) {
    let csvContent = `${identifier}\n${IDENTIFIER_LINE_2}\n`;
    let returnData = [];
    
    if (identifier === Identifiers.LOCALIZATION) {
        const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark"];
        csvContent += headers.join(",") + "\n";
        
        Object.entries(data).forEach(([label, contacts]) => {
            const electrodeDescription = contacts.description;
            Object.entries(contacts).forEach(([contactNumber, contactData]) => {
                // Skip the 'description' key, as it's not a contact
                if (contactNumber === 'description') return;

                const {
                    contactDescription,
                    associatedLocation
                } = contactData;

                const row = [label, contactNumber, electrodeDescription, contactDescription, associatedLocation, 0, 0];
                csvContent += row.join(",") + "\n";
                
                if (!download) {
                    returnData.push({
                        Label: label,
                        ContactNumber: parseInt(contactNumber),
                        ElectrodeDescription: electrodeDescription,
                        AssociatedLocation: associatedLocation,
                        ContactDescription: contactDescription,
                        Mark: 0,
                        SurgeonMark: 0
                    });
                }
            });
        });
    }
    
    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "localization_" + new Date().toISOString().split('T')[0] + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        switch (identifier) {
            case Identifiers.DESIGNATION: return parseDesignation(Papa.unparse(returnData));
            case Identifiers.STIMULATION: return parseStimulation(Papa.unparse(returnData));
        }
        return parseDesignation(Papa.unparse(returnData));
    }
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 * 
 * @param {Object[]} designationData - The data to be saved.
 * @param {Object[]} localizationData - The localization data to be used.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {string} The CSV content.
 */
export function saveDesignationCSVFile(designationData, localizationData, download = true) {
    let csvContent = `${Identifiers.DESIGNATION}\n${IDENTIFIER_LINE_2}\n`;
    const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark"];
    csvContent += headers.join(",") + "\n";

    // Create a map of electrode contacts for quick lookup
    const contactMap = {};
    designationData.forEach(electrode => {
        contactMap[electrode.label] = electrode.contacts;
    });

    // Use localization data structure but include marks from designation
    Object.entries(localizationData).forEach(([label, contacts]) => {
        const electrodeDescription = contacts.description;
        const designationContacts = contactMap[label] || [];

        Object.entries(contacts).forEach(([contactNumber, contactData]) => {
            // Skip the 'description' key
            if (contactNumber === 'description') return;

            const {
                contactDescription,
                associatedLocation
            } = contactData;

            // Find corresponding designation contact
            const designationContact = designationContacts.find(c => c.index === parseInt(contactNumber));
            const mark = designationContact ? designationContact.mark : 0;
            const surgeonMark = designationContact ? (designationContact.surgeonMark ? 1 : 0) : 0;

            const row = [
                label,
                contactNumber,
                electrodeDescription,
                contactDescription,
                associatedLocation,
                mark,
                surgeonMark
            ];
            csvContent += row.join(",") + "\n";
        });
    });

    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "designation_" + new Date().toISOString().split('T')[0] + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return csvContent;
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 *
 * @param {Object[]} stimulationData - The data to be saved.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {string} The CSV content.
 */
export function saveStimulationCSVFile(stimulationData, planOrder, isFunctionalMapping = false, download = true) {
    let csvContent = isFunctionalMapping ? `${Identifiers.STIMULATION_FUNCTION}\n${IDENTIFIER_LINE_2}\n` : `${Identifiers.STIMULATION}\n${IDENTIFIER_LINE_2}\n`;
    const headers = ["Label", "ContactNumber", "ElectrodeDescription", "ContactDescription", "AssociatedLocation", "Mark", "SurgeonMark", "Pair", "IsPlanning", "Frequency", "Duration", "Current", "PlanOrder"];
    csvContent += headers.join(",") + "\n";

    // Create a map of electrode contacts for quick lookup
    const contactMap = {};
    stimulationData.forEach(electrode => {
        contactMap[electrode.label] = electrode.contacts;
    });

    // Reconstruct the data
    const output = stimulationData.map(electrode => {
        return electrode.contacts.map(contact => {
            let order = contact.isPlanning ? planOrder.indexOf(contact.id) : -1;
            return [
                electrode.label,
                contact.index,
                contact.__electrodeDescription__,
                contact.__contactDescription__,
                contact.associatedLocation,
                contact.mark,
                contact.surgeonMark,
                contact.pair,
                contact.isPlanning,
                contact.frequency,
                contact.duration,
                contact.current,
                order,
            ].join(",");
        }).join("\n");
    })

    csvContent += output.join("\n");

    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "stimulation_" + new Date().toISOString().split('T')[0] + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return csvContent;
}

/**
 * Saves a CSV file from data and downloads it or returns the data.
 *
 * @param {Object[]} testData - The test data to be saved.
 * @param {Object[]} contacts - Contacts associated with tests.
 * @param {boolean} download - Whether to download the file or return the data.
 * @returns {string} The CSV content.
 */
export function saveTestCSVFile(testData, contacts, download = true) {
    let csvContent = `${Identifiers.TEST_PLANNING}\n${IDENTIFIER_LINE_2}\n`;
    const headers = [
            "Label",
            "ContactNumber",
            "ElectrodeDescription",
            "ContactDescription",
            "AssociatedLocation",
            "Mark",
            "SurgeonMark",
            "Pair",
            "Frequency",
            "Duration",
            "Current",
            "TestID" // Added TestID for associating tests
        ];

        // Create CSV rows
        const rows = contacts.flatMap(contact => {
            const contactTests = testData[contact.id] || [];
            if (contactTests.length === 0) {
                return [[
                    contact.electrodeLabel, // Label
                    contact.index, // ContactNumber
                    contact.__electrodeDescription__, // ElectrodeDescription
                    contact.__contactDescription__, // ContactDescription
                    contact.associatedLocation, // AssociatedLocation
                    contact.mark, // Mark
                    contact.surgeonMark, // SurgeonMark
                    contact.pair.index, // Pair
                    contact.frequency, // Frequency
                    contact.duration, // Duration
                    contact.current, // Current
                    "", // No test
                ]];
            }
            return contactTests.map(test => [
                contact.electrodeLabel, // Label
                contact.index, // ContactNumber
                contact.__electrodeDescription__, // ElectrodeDescription
                contact.__contactDescription__, // ContactDescription
                contact.associatedLocation, // AssociatedLocation
                contact.mark, // Mark
                contact.surgeonMark, // SurgeonMark
                contact.pair.index, // Pair
                contact.frequency, // Frequency
                contact.duration, // Duration
                contact.current, // Current
                test.id, // TestID
            ]);
        });

        // Combine headers and rows into CSV format
        csvContent += [
            headers.join(','), // Header row
            ...rows.map(row => row.join(',')) // Data rows
        ].join('\n');

    if (download) {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "tests_" + new Date().toISOString().split('T')[0] + ".csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return csvContent;
}
