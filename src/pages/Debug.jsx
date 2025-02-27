import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { parseCSVFile, Identifiers } from "../utils/CSVParser";

const Debug = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [csvData, setCsvData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/tables")
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

        try {
            const parsedData = await parseCSVFile(file, Identifiers.LOCALIZATION);
            setCsvData(parsedData);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Dashboard</h1>

            <h3>Import CSV</h3>
            <input type="file" accept=".csv" onChange={handleCSVUpload} />
            {error && <p style={{ color: "red" }}>{error}</p>}

            {csvData && (
                <div>
                    <h2>CSV Data</h2>
                    <table border="1">
                        <thead>
                            <tr>
                                {Object.keys(csvData[0]).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {csvData.map((row, index) => (
                                <tr key={index}>
                                    {Object.values(row).map((value, i) => (
                                        <td key={i}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
