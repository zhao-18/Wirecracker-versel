import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { parseCSVFile, saveCSVFile, Identifiers } from "../utils/CSVParser.js";

// Function to flatten nested objects for "LOCALIZATION"
const flattenData = (nestedData) => {
    if (!Array.isArray(nestedData)) {
        nestedData = [nestedData];
    }

    return nestedData.map((item) => {
        const flattenedItem = {};

        // Flatten each item recursively
        const flatten = (obj, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    flatten(obj[key], newKey); // Recursively flatten if nested
                } else {
                    flattenedItem[newKey] = obj[key];
                }
            });
        };

        flatten(item);
        return flattenedItem;
    });
};

const Debug = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [csvData, setCsvData] = useState(null);
    const [identifier, setIdentifier] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://localhost:5000/api/tables")
            .then(response => response.json())
            .then(data => {
                setTables(data.tables);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching tables:", error);
                setLoading(false);
            });
    }, []);

    const handleCSVUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError(""); // Clear errors
        setCsvData(null); // Reset CSV data
        setIdentifier(null);

        try {
            const { identifier, data } = await parseCSVFile(file);
            setCsvData(data);
            setIdentifier(identifier);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSaveCSV = async () => {
        if (!csvData) {
            setError("No CSV data to save.");
            return;
        }
        try {
            await saveCSVFile(identifier, csvData);
            alert("CSV file saved successfully!");
        } catch (err) {
            setError("Failed to save CSV file.");
        }
    };

    const displayData = identifier === Identifiers.LOCALIZATION ? flattenData(csvData) : csvData;

    return (
        <div>
            <h1>Debug</h1>

            <h3>Import CSV</h3>
            <input type="file" accept=".csv" onChange={handleCSVUpload} />
            {error && <p style={{ color: "red" }}>{error}</p>}

            {csvData && (
                <div>
                    <h2>CSV Data ({identifier})</h2>
                    <table border="1">
                        <thead>
                            <tr>
                                {Object.keys(displayData[0]).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
                                        <td key={i}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={handleSaveCSV}>Save CSV</button>
                </div>
            )}

            <h3>Available Tables: </h3>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {tables.map((table) => (
                        <li key={table}>
                            <Link to={`/database/${table}`}>
                                <button>View {table}</button>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Debug;
