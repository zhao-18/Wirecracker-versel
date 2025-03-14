import { demoContactData } from "./demoData";
import React, { useState, setState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import { saveStimulationCSVFile } from "../../utils/CSVParser";

const ContactSelection = ({ initialData = {}, onStateChange, savedState = {}, isFunctionalMapping = false }) => {
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || demoContactData)
    const [planningContacts, setPlanningContacts] = useState(() => {
        if (savedState.planningContacts) return savedState.planningContacts;
        if (initialData.data) {
            return initialData.data.map(electrode => {
                return electrode.contacts.filter((contact) => contact.isPlanning);
            })
            .flat()
            .sort((a, b) => a.order - b.order);
        }
        return [];
    });
    const [areAllVisible, setAreAllVisible] = useState(savedState.areAllVisible || false);      // Boolean for if all contacts are visible
    const [isPairing, setIsPairing] = useState(savedState.isPairing || false);
    const [submitPlanning, setSubmitPlanning] = useState(savedState.submitPlanning || false);

    const [state, setState] = useState(() => {
        if (!savedState.frequency) savedState.frequency = [];
        if (!savedState.duration) savedState.duration = [];
        if (!savedState.current) savedState.current = [];

        return savedState;
    });

    // Save state changes
    useEffect(() => {
        onStateChange(state);
    }, [state]);


    useEffect(() => {
        setState((prevState) => {
            return {
                ...prevState,
                electrodes: electrodes,
                planningContacts: planningContacts,
                areAllVisible: areAllVisible,
                isPairing: isPairing,
                submitPlanning: submitPlanning,
            }
        })
    }, [electrodes, planningContacts, areAllVisible, isPairing, submitPlanning]);

    // Function to handle "drop" on planning pane. Takes contact and index, and insert the contact
    // at the index or at the end if index is not specified. If the contact exist already, this function
    // will change the contact's location to index passed (or to the end)
    const handleDropToPlanning = (contact, index = "") => {
        setPlanningContacts((prev) => {
            if (index === "") index = prev.length;
            if (index > prev.length) index = prev.length;
            const newContacts = [...prev];

            if (prev.some((c) => c.id === contact.id)) {
                // Move existing one
                let oldIndex = prev.indexOf(contact);
                if (index === oldIndex + 1) return prev; // Ignore if index is one below
                newContacts.splice(index, 0, newContacts.splice(oldIndex, 1)[0]);
            } else {
                // Add new one
                newContacts.splice(index, 0, contact);
            }

            return newContacts;
        });

        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((electrode) => {
                return {
                    ...electrode,
                    contacts: electrode.contacts.map((c) => {
                        if (c.id === contact.id) {
                            return { ...c, isPlanning: true };
                        }
                        return c;
                    }),
                };
            });
        });
    };

    // Function to handle "drop" on contact list part. Simply removes contact from the list
    const handleDropBackToList = (contact) => {
        setPlanningContacts((prev) => prev.filter((c) => c.id !== contact.id));
        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((electrode) => {
                return {
                    ...electrode,
                    contacts: electrode.contacts.map((c) => {
                        if (c.id === contact.id) {
                            return { ...c, isPlanning: false };
                        }
                        return c;
                    }),
                };
            });
        });
    };

    // Add id and such so that it can be used after making pair
    electrodes.map((electrode) => {
        electrode.contacts.map((contact, index) => {
            const contactId = `${electrode.label}${index + 1}`;
            contact.id = contactId;
            contact.electrodeLabel = electrode.label;
        })
    });

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen p-6 space-x-6">
                <ContactList electrodes={electrodes} onDrop={handleDropBackToList} onClick={handleDropToPlanning} droppedContacts={planningContacts} areAllVisible={areAllVisible} isPairing={isPairing} submitPlanning={submitPlanning} onStateChange={setState} savedState={state} setElectrodes={setElectrodes}/>

                <PlanningPane state={state} electrodes={electrodes} contacts={planningContacts} onDrop={handleDropToPlanning} onDropBack={handleDropBackToList} submitFlag={submitPlanning} setSubmitFlag={setSubmitPlanning} setElectrodes={setElectrodes} onStateChange={setState} savedState={state} isFunctionalMapping={isFunctionalMapping} />
            </div>
            <Container className="">
                <Button
                    tooltip="Pair contacts"
                    styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                    onClick={() => {setIsPairing(!isPairing)}}>
                    <div>P</div>
                </Button>
                <Button
                    tooltip="Toggle unmarked contacts"
                    styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                    onClick={() => setAreAllVisible(!areAllVisible)}>
                    <div>T</div>
                </Button>
            </Container>
        </DndProvider>
    );
};

// Generate list of contacts from list of electrodes
const ContactList = ({ electrodes, onDrop, onClick, droppedContacts, areAllVisible, isPairing, submitPlanning, onStateChange, savedState, setElectrodes }) => {
    const [submitContact, setSubmitContact] = useState(savedState.submitContact || false);
    useEffect(() => {
        onStateChange((prevState) => {
            return {
                ...prevState,
                submitContact: submitContact
            }
        })
    }, [submitContact]);

    const [, drop] = useDrop(() => ({
        accept: "CONTACT",
        drop: (item) => onDrop(item),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const handleOnClick = (electrode, contact) => {
        if (isPairing) {
            changePair(electrode, contact);
        } else {
            onClick(contact);
        }
        setSubmitContact(!submitContact);
    }

    const changePair = (electrode, contact) => {
        // One or fewer contacts in electrode
        if (electrode.contacts.length <= 1) {
            return;
        }

        const updatedElectrode = {
            ...electrode,
            contacts: electrode.contacts.map((c) => ({ ...c })),
        };

        // Reset the saved pair of the current contact's pair
        var pairedContact = electrode.contacts[contact.pair - 1];
        electrode.contacts[contact.pair - 1].pair = pairedContact.index;

        // Change the current contact's saved pair
        if (contact.pair === contact.index - 1) {
            contact.pair += 2;
            if (electrode.contacts.length <= contact.index) {
                contact.pair--;
            }
        } else {
            contact.pair--;
            if (contact.pair < 1 && contact.index === 2 && electrode.contacts.length > 2) {
                contact.pair += 3;
            } else if (contact.pair < 1 && (contact.index === 1 || contact.index === 2)) {
                contact.pair += 2;
            }
        }

        // Reset new pair's previous pairing
        const newPairedContact = updatedElectrode.contacts[contact.pair - 1];
        updatedElectrode.contacts[newPairedContact.pair - 1].pair = updatedElectrode.contacts[newPairedContact.pair - 1].index;

        // Change the new pair's pairing
        updatedElectrode.contacts[contact.pair - 1].pair = contact.index;

        // Update the electrodes state
        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((e) => {
                if (e.label === updatedElectrode.label) {
                    return updatedElectrode;
                }
                return e;
            });
        });
    }

    const showAvailableContacts = (electrode) => {
        return electrode.contacts.map((contact, index) => { // Horizontal list for every contact
            const pair = electrode.contacts[contact.pair - 1];

            // Filter out the non-marked contacts.
            const shouldAppear = !(droppedContacts.some((c) => c.id === contact.id)) && (contact.mark || contact.surgeonMark);
            const pairShouldAppear = !(droppedContacts.some((c) => c.id === pair.id)) && (pair.mark || pair.surgeonMark);

            return (
                !(contact.isPlanning || pair.isPlanning) && (
                    areAllVisible ? (
                        <Contact key={contact.id}
                            contact={contact}
                            onClick={() => handleOnClick(electrode, contact)} />
                    ) : (
                        (shouldAppear || pairShouldAppear) && (
                            <Contact key={contact.id}
                                contact={contact}
                                onClick={() => handleOnClick(electrode, contact)} />
                        )
                    )
                )
            );
        })
    }

    return (
        <div className="flex-1" ref={drop}>
            <ul className="space-y-4">
                {electrodes.map((electrode) => ( // Vertical list for every electrode
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        {(submitContact != submitPlanning) ? (
                            <ul className="flex space-x-4">
                                {showAvailableContacts(electrode)} {/* contact */}
                            </ul>
                        ) : (
                            <ul className="flex space-x-4">
                                {showAvailableContacts(electrode)}
                            </ul>
                        )}
                    </li>
                ))} {/* electrode */}
            </ul>
        </div>
    );
};

// Draggable contact in contact list
const Contact = ({ contact, onClick }) => {
    // Handle "drag"
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contact,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    let classes = `min-w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"} `;
    switch (contact.mark) {
        case 1:
            classes += "bg-red-200";
            break;
        case 2:
            classes += "bg-yellow-200";
            break;
        default:
            classes += "bg-slate-200";
    }

    return (
        <li ref={drag}
            className={classes}
            onClick={onClick}
            key={contact.index}>
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
            <p className="text-sm font-semibold text-gray-500">Pair:  {contact.pair}</p>
        </li>
    );
};

// Planning pane on the right
const PlanningPane = ({ state, electrodes, contacts, onDrop, onDropBack, submitFlag, setSubmitFlag, setElectrodes, onStateChange, savedState, isFunctionalMapping = false }) => {
    const [hoverIndex, setHoverIndex] = useState(null);

    let index = hoverIndex; // For synchronization between hover and drop

    // Handle "Drop" and hover
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "CONTACT",
        hover: (item, monitor) => {
            if (!monitor.isOver()) return;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            // Estimate the index based on y coordinate
            const hoverY = clientOffset.y;
            let elementSize = document.querySelector('li.planning-contact')?.clientHeight || 155;
            const newIndex = Math.max(0, Math.floor((hoverY - elementSize / 2) / elementSize));
            setHoverIndex(newIndex);
            index = newIndex;
        },
        drop: (item) => {
            onDrop(item, index);
            setHoverIndex(null);
            index = 0;
            item.isPlanning = true;
            setSubmitFlag(!submitFlag);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const createTestSelectionTab = () => {
        if (Object.keys(contacts).length === 0) return;

        // Get designation data from the current localization
        try {
            exportState(state, electrodes, isFunctionalMapping, false);
        } catch (error) {
            alert('Error saving data on database. Changes are not saved');
        }

        // Clean up the contacts
        const functionalTestData = contacts.map(contact => {
            const updatedContact = electrodes
                .flatMap(electrode => electrode.contacts)
                .find(c => c.id === contact.id);

            const pair = electrodes
                .find(electrode => electrode.label === contact.electrodeLabel)
                ?.contacts.find(c => c.index === contact.pair);

            return {
                __contactDescription__: contact.__contactDescription__,
                __electrodeDescription__: contact.__electrodeDescription__,
                associatedLocation: contact.associatedLocation,
                electrodeLabel: contact.electrodeLabel,
                id: contact.id,
                index: contact.index,
                mark: contact.mark,
                pair: pair,
                surgeonMark: contact.surgeonMark,
                duration: updatedContact?.duration,
                frequency: updatedContact?.frequency,
                current: updatedContact?.current,
            }
        })

        // Create a new tab with the designation data
        const event = new CustomEvent('addFunctionalTestTab', {
            detail: { contacts: functionalTestData, tests: {} }
        });
        window.dispatchEvent(event);
    };

    return (
        <div ref={drop} className={`p-4 w-1/4 border-l shadow-lg ${isOver ? "bg-gray-100" : ""}`}>
            <h2 className="text-2xl font-bold mb-4">Planning Pane</h2>
            {contacts.length === 0 ? (
                <p className="text-lg text-gray-500">Drag contacts here</p> // Show text if there are no contacts in the pane
            ) : (
                <ul className="space-y-2 relative">
                    {contacts.map((contact, index) => (
                        <React.Fragment key={contact.id}>
                            {hoverIndex === index && isOver && (
                                <div className="h-1 bg-blue-500 w-full my-1"></div> // Blue bar within the list
                            )}
                            <PlanningContact contact={contact} onDropBack={onDropBack} onStateChange={onStateChange} savedState={savedState} setElectrodes={setElectrodes} />
                        </React.Fragment>
                    ))}
                    {hoverIndex >= contacts.length && isOver && (
                        <div className="h-1 bg-blue-500 w-full my-1"></div> // Blue bar at the end of list
                    )}
                </ul>
            )}
            <div className="flex space-x-2 absolute right-10 bottom-10 ">
                {isFunctionalMapping ? (
                    <button className={`py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                            contacts.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                            }`} onClick={createTestSelectionTab}>
                        select tests
                    </button>
                ) : (
                    <div />

                )}

                {/* export button. Disabled if no contact is in the list */}
                <button className={`py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                        contacts.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                        }`} onClick={() => exportState(state, electrodes, isFunctionalMapping)}>
                    export
                </button>
            </div>
        </div>
    );
};

// Draggable contact in planning pane area
const PlanningContact = ({ contact, onDropBack, onStateChange, savedState, setElectrodes }) => {
    // To persist between tab switch and reload
    const [frequency, setFrequency] = useState(savedState.frequency?.[contact.id] || contact.frequency || 0);
    const [duration, setDuration] = useState(savedState.duration?.[contact.id] || contact.duration || 0);
    const [current, setCurrent] = useState(savedState.current?.[contact.id] || contact.current || 0);

    // Handle "Drag"
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contact,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    // Update savedState when inputs change
    const updateSavedState = (field, value) => {
        onStateChange((prevState) => {
            return {
                ...prevState,
                [field]: {
                    ...prevState[field],
                    [contact.id]: value,
                },
            };
        });
    };

    const updateContact = (field, value) => {
        setElectrodes((prevElectrodes) => {
            return prevElectrodes.map((electrode) => {
                return {
                    ...electrode,
                    contacts: electrode.contacts.map((c) => {
                        if (c.id === contact.id) {
                            return { ...c, [field]: value };
                        }
                        return c;
                    }),
                };
            });
        });
    };

    const handleFrequencyChange = (e) => {
        const value = parseFloat(e.target.value);
        setFrequency(value);
        updateContact("frequency", value);
        updateSavedState("frequency", value);
    };

    const handleDurationChange = (e) => {
        const value = parseFloat(e.target.value);
        setDuration(value);
        updateContact("duration", value);
        updateSavedState("duration", value);
    };

    const handleCurrentChange = (e) => {
        const value = parseFloat(e.target.value);
        setCurrent(value);
        updateContact("current", value);
        updateSavedState("current", value);
    };

    let classes = `min-w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
        isDragging ? "opacity-50" : "opacity-100"} `;
    switch (contact.mark) {
    case 1:
        classes += "bg-red-200";
        break;
    case 2:
        classes += "bg-yellow-200";
        break;
    default:
        classes += "bg-slate-200";
    }

    return (
        <li ref={drag}
            className={`planning-contact p-2 border rounded bg-white shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"
            }`}
            key={contact.id}>
            {(contact.pair === contact.index) ? (
                <p className="text-lg font-semibold">{contact.id}</p>
            ) : (
                <p className="text-lg font-semibold">{contact.id}-{contact.electrodeLabel + contact.pair}</p>
            )}
            <p className="text-sm font-semibold text-gray-500">Location: {contact.associatedLocation}</p>

            <div className="flex space-x-2 mt-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Frequency (Hz)</label>
                    <input
                        type="number"
                        value={frequency}
                        onChange={handleFrequencyChange}
                        className="w-full p-1 border rounded"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Duration (s)</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={handleDurationChange}
                        className="w-full p-1 border rounded"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Current (mA)</label>
                    <input
                        type="number"
                        value={current}
                        onChange={handleCurrentChange}
                        className="w-full p-1 border rounded"
                    />
                </div>
            </div>

            <button onClick={() => onDropBack(contact)}
                    className="text-red-500 text-sm mt-2 underline" >
                Remove
            </button>
        </li>
    );
};

const exportState = async (state, electrodes, isFunctionalMapping, download = true) => {
    try {
        // First save to database if we have a file ID
        if (state.fileId) {
            console.log('Saving stimulation plan to database...');

            // Get user ID from session
            const token = localStorage.getItem('token');
            if (!token) {
                alert('User not authenticated. Please log in to save designations.');
                return;
            }

//             try {
//                 // First save/update file metadata
//                 const response = await fetch('http://localhost:5000/api/save-designation', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': token
//                     },
//                     body: JSON.stringify({
//                         designationData: electrodes,
//                         localizationData: localizationData,
//                         fileId: state.fileId,
//                         fileName: state.fileName,
//                         creationDate: state.creationDate,
//                         modifiedDate: new Date().toISOString()
//                     }),
//                 });
//
//                 const result = await response.json();
//                 if (!result.success) {
//                     console.error('Failed to save designation:', result.error);
//                     alert(`Failed to save designation: ${result.error}`);
//                     return;
//                 }
//
//                 // Update the state with new modified date
//                 setState(prevState => ({
//                     ...prevState,
//                     modifiedDate: new Date().toISOString()
//                 }));
//
//                 // Show success feedback if this was a save operation
//                 if (!download) {
//                     setShowSaveSuccess(true);
//                     setTimeout(() => setShowSaveSuccess(false), 3000); // Hide after 3 seconds
//                 }
//
//                 console.log('Designation saved successfully');
//             } catch (error) {
//                 console.error('Error saving designation:', error);
//                 alert(`Error saving designation: ${error.message}`);
//                 return;
//             }
        }

        // Then export to CSV as before
        let planOrder = state.planningContacts.map(contact => contact.id);
        saveStimulationCSVFile(electrodes, planOrder, isFunctionalMapping, download);
    } catch (error) {
        console.error('Error exporting contacts:', error);
        alert(`Error exporting contacts: ${error.message}`);
    }
};

export default ContactSelection;
