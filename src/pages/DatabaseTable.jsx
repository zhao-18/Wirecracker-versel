import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const DatabaseTable = () => {
    const { table } = useParams();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://wirecracker-versel.vercel.app:5000/api/tables/${table}`)
            .then(response => response.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching table data:", error);
                setLoading(false);
            });
    }, [table]);

    const isForeignKey = (columnName) => {
        return columnName.endsWith("_id"); // Example rule for foreign keys
    };

    const getTableURLFromKey = (key) => {
        if (key == "cort_id")
            return "/database/cort";
        if (key == "gm_id")
            return "/database/gm";

        return `/database/${key.replace("_id", "")}`;
    };

    return (
        <div>
            <h1>Data from {table}</h1>
            {loading ? (
                <p>Loading...</p>
            ) : data.length > 0 ? (
                <table border="1">
                    <thead>
                        <tr>
                            {Object.keys(data[0]).map((key) => (
                                <th key={key}>{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                {Object.entries(row).map(([key, value], i) => (
                                    <td key={i}>
                                        {isForeignKey(key) ? (
                                            <a href={getTableURLFromKey(key)}>
                                                {value}
                                            </a>
                                        ) : (
                                            value
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No data available</p>
            )}
        </div>
    );
};

export default DatabaseTable;
