import React, { useState, useEffect } from "react";
import { demoContactsData, demoTestData } from "./demoContactsData";
import { saveTestCSVFile } from "../../utils/CSVParser";

const FunctionalTestSelection = ({
    initialData = {},
    onStateChange,
    savedState = {},
}) => {
    const allAvailableTests = demoTestData;

    const [contacts, setContacts] = useState(
        savedState.contacts || initialData.data.contacts || demoContactsData
    );
    const [tests, setTests] = useState(() => {
        if (savedState.tests) return savedState.tests;
        if (initialData.data.tests) {
            let loadedTests = {};
            Object.entries(initialData.data.tests).map(([contactID, tests]) => { // for each contact
                loadedTests[contactID] = tests.map(test => {
                    if (!(test.name && test.region && test.description && test.population && test.disruptionRate && test.tag)) {
                        return allAvailableTests.find(candidate => candidate.id === test.id);
                    }
                    return test;
                })
            })
            return loadedTests;
        }

        return {};
    });
    const [availableTests, setAvailableTests] = useState(
        savedState.availableTests || [],
    );
    const [showPopup, setShowPopup] = useState(savedState.showPopup || false);
    const [selectedContact, setSelectedContact] = useState(
        savedState.selectedContact || null,
    );
    const [selectedTest, setSelectedTest] = useState(
        savedState.selectedTest || null,
    );
    const [expandedTests, setExpandedTests] = useState(
        savedState.expandedTests || [],
    ); // Tracks expanded tests uniquely
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const [state, setState] = useState(savedState);

    useEffect(() => {
        onStateChange(state);
    }, [state]);

    useEffect(() => {
        setState(() => {
            return {
                contacts: contacts,
                tests: tests,
                availableTests: availableTests,
                showPopup: showPopup,
                selectedContact: selectedContact,
                selectedTest: selectedTest,
                expandedTests: expandedTests,
            };
        });
    }, [
        contacts,
        tests,
        availableTests,
        showPopup,
        selectedContact,
        selectedTest,
        expandedTests,
    ]);

    // Function to select the best test based on population and disruption rate
    const selectBestTest = (availableTests) => {
        return availableTests.sort(
            (a, b) =>
                b.population - a.population ||
                b.disruptionRate - a.disruptionRate,
        )[0];
    };

    // Update availableTests whenever selectedContact changes
    useEffect(() => {
        if (selectedContact) {
            const filteredTests = allAvailableTests
                .filter(
                    (test) =>
                        test.region === selectedContact.associatedLocation,
                )
                .filter(
                    (test) =>
                        !tests[selectedContact.id]?.some(
                            (t) => t.id === test.id,
                        ),
                )
                .sort(
                    (a, b) =>
                        b.population - a.population ||
                        b.disruptionRate - a.disruptionRate,
                );
            setAvailableTests(filteredTests);
        }
    }, [selectedContact, tests, allAvailableTests]);

    // Automatically assigns the best test to each contact
    const autoAssignTests = () => {
        const newTests = {};
        contacts.forEach((contact) => {
            const availableTests = allAvailableTests.filter(
                (test) => test.region === contact.associatedLocation,
            );
            if (availableTests.length > 0) {
                const bestTest = selectBestTest(availableTests);
                newTests[contact.id] = [bestTest];
            }
        });
        setTests(newTests);
    };

    const handleAddTest = (contact) => {
        setSelectedContact(contact);
        setShowPopup(true);
        setSelectedTest(null);
    };

    const confirmAddTest = () => {
        if (selectedContact && selectedTest) {
            setTests((prev) => ({
                ...prev,
                [selectedContact.id]: [
                    ...(prev[selectedContact.id] || []),
                    selectedTest,
                ],
            }));
        }
        setShowPopup(false);
    };

    const removeTest = (contactLabel, testIndex) => {
        setTests((prev) => ({
            ...prev,
            [contactLabel]: prev[contactLabel].filter(
                (_, index) => index !== testIndex,
            ),
        }));
    };

    // Toggle a single test's detail view uniquely
    const toggleTestDetails = (contactId, testId) => {
        const key = `${contactId}-${testId}`; // Unique key for each test instance
        setExpandedTests((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key); // Collapse if already expanded
            } else {
                newSet.add(key); // Expand if not expanded yet
            }
            return Array.from(newSet);
        });
    };

    const exportTests = async (tests, contacts, download = true) => {

        try {
            // First save to database if we have a file ID
            // if (state.fileId) {
            //     console.log('Saving designation to database...');
            //
            //     // Get user ID from session
            //     const token = localStorage.getItem('token');
            //     if (!token) {
            //         alert('User not authenticated. Please log in to save designations.');
            //         return;
            //     }
            //
            //     try {
            //         // First save/update file metadata
            //         const response = await fetch('http://localhost:5000/api/save-designation', {
            //             method: 'POST',
            //             headers: {
            //                 'Content-Type': 'application/json',
            //                 'Authorization': token
            //             },
            //             body: JSON.stringify({
            //                 designationData: electrodes,
            //                 localizationData: localizationData,
            //                 fileId: state.fileId,
            //                 fileName: state.fileName,
            //                 creationDate: state.creationDate,
            //                 modifiedDate: new Date().toISOString()
            //             }),
            //         });
            //
            //         const result = await response.json();
            //         if (!result.success) {
            //             console.error('Failed to save designation:', result.error);
            //             alert(`Failed to save designation: ${result.error}`);
            //             return;
            //         }
            //
            //         // Update the state with new modified date
            //         setState(prevState => ({
            //             ...prevState,
            //             modifiedDate: new Date().toISOString()
            //         }));
            //
            //         // Show success feedback if this was a save operation
            //         if (!download) {
            //             setShowSaveSuccess(true);
            //             setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
            //         }
            //
            //         console.log('Designation saved successfully');
            //     } catch (error) {
            //         console.error('Error saving designation:', error);
            //         alert(`Error saving designation: ${error.message}`);
            //         return;
            //     }
            // }
            // Then export to CSV as before
            saveTestCSVFile(tests, contacts, download);
        } catch (error) {
            console.error("Error exporting contacts:", error);
            alert(`Error exporting contacts: ${error.message}`);
        }
    };

    return (
        <div className="p-12 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Function Mapping Test Selection
            </h1>

            {/* Auto Assign Button */}
            <button
                className="mb-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={autoAssignTests}
            >
                Auto-Assign Best Tests
            </button>

            <div className="bg-white py-4 px-40 shadow-md rounded-lg">
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        className="border p-4 mb-4 rounded-lg shadow-sm bg-gray-100"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg">
                                {contact.id}
                            </span>
                            <span className="text-gray-600 text-sm">
                                {contact.associatedLocation}
                            </span>
                        </div>
                        <div className="text-gray-500 text-sm">
                            Duration: {contact.duration} sec | Frequency:{" "}
                            {contact.frequency} Hz | Current: {contact.current}{" "}
                            mA
                        </div>

                        {/* Display added tests */}
                        <div className="mt-2">
                            {tests[contact.id]?.map((test, index) => {
                                const testKey = `${contact.id}-${test.id}`;
                                return (
                                    <div
                                        key={index}
                                        className="bg-blue-100 p-3 rounded mt-1 cursor-pointer"
                                        onClick={() =>
                                            toggleTestDetails(
                                                contact.id,
                                                test.id,
                                            )
                                        }
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">
                                                    {test.name}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {test.tag.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-gray-300 text-xs text-gray-700 px-2 py-1 rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <button
                                                className="text-red-500 hover:text-red-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeTest(
                                                        contact.id,
                                                        index,
                                                    );
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="text-xs text-gray-700">
                                            Population: {test.population} |
                                            Disruption: {test.disruptionRate}%
                                        </div>

                                        {expandedTests.includes(testKey) && (
                                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm relative">
                                                <p className="text-gray-600">
                                                    {test.description}
                                                </p>
                                                <a
                                                    href="https://example.com"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
                                                >
                                                    More Details
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add test button */}
                        <button
                            className="mt-2 w-full text-blue-600 hover:text-blue-800 text-sm"
                            onClick={() => handleAddTest(contact)}
                        >
                            + Add Test
                        </button>
                    </div>
                ))}
            </div>

            {/* Test Selection Popup */}
            {showPopup && selectedContact && (
                <div className="fixed inset-0 bg-black/25 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-h-[450px]">
                        <h2 className="text-lg font-bold mb-4">
                            Select a Test for {selectedContact.id}
                        </h2>
                        <div className="overflow-y-auto max-h-[350px]">
                            {availableTests.map((test) => {
                                const testKey = `${selectedContact.id}-${test.id}`; // Use the same key format as elsewhere
                                return (
                                    <div
                                        key={test.id}
                                        className={`p-3 rounded cursor-pointer ${
                                            selectedTest?.id === test.id
                                                ? "bg-blue-200"
                                                : "hover:bg-gray-200"
                                        }`}
                                        onClick={() => {
                                            if (selectedTest?.id === test.id) {
                                                toggleTestDetails(
                                                    selectedContact.id,
                                                    test.id,
                                                ); // Use the correct key format
                                            } else {
                                                setSelectedTest(test);
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">
                                                    {test.name}
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {test.tag.map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="bg-gray-300 text-xs text-gray-700 px-2 py-1 rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-700">
                                            Population: {test.population} |
                                            Disruption: {test.disruptionRate}%
                                        </div>
                                        {expandedTests.includes(testKey) && (
                                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm relative">
                                                <p className="text-gray-600">
                                                    {test.description}
                                                </p>
                                                <a
                                                    href="https://example.com"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute bottom-2 right-2 bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-700"
                                                >
                                                    More Details
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {availableTests.length === 0 && (
                                <p className="text-center text-gray-600">
                                    No tests available.
                                </p>
                            )}
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className={`bg-gray-500 text-white mx-4 py-2 rounded hover:bg-gray-700 ${
                                    availableTests.length === 0
                                        ? "w-1/1"
                                        : "w-1/2"
                                }`}
                                onClick={() => setShowPopup(false)}
                            >
                                Cancel
                            </button>
                            {availableTests.length === 0 ? (
                                <div></div>
                            ) : (
                                <button
                                    className={`w-1/2 text-white mx-4 py-2 rounded ${
                                        !selectedTest
                                            ? "bg-gray-500"
                                            : "bg-blue-500 hover:bg-blue-700"
                                    }`}
                                    onClick={confirmAddTest}
                                >
                                    Confirm
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="fixed bottom-6 right-6 z-50 flex gap-2">
                <div className="relative">
                    <button
                        className="py-2 px-4 bg-green-500 text-white font-bold rounded hover:bg-green-700 border border-green-700 shadow-lg"
                        onClick={() => exportTests(tests, contacts, false)}
                    >
                        Save
                    </button>
                    {showSaveSuccess && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                            Save successful!
                        </div>
                    )}
                </div>
                <button
                    className="py-2 px-4 bg-blue-500 text-white font-bold rounded hover:bg-blue-700 border border-blue-700 shadow-lg"
                    onClick={() => exportTests(tests, contacts)}
                >
                    Export
                </button>
            </div>
        </div>
    );
};

export default FunctionalTestSelection;
