import { useState, useEffect } from 'react';
import Popup from 'reactjs-popup';
import { Container, Button, darkColors, lightColors } from 'react-floating-action-button';
import 'reactjs-popup/dist/index.css';
import { saveCSVFile, Identifiers } from '../utils/CSVParser.js';
import { supabase } from '../utils/supabaseClient';

const Localization = ({ initialData = {}, onStateChange, savedState = {} }) => {
    const [expandedElectrode, setExpandedElectrode] = useState(savedState.expandedElectrode || '');
    const [submitFlag, setSubmitFlag] = useState(savedState.submitFlag || false);
    const [electrodes, setElectrodes] = useState(savedState.electrodes || initialData.data || {});
    const [fileId, setFileId] = useState(savedState.fileId || null);
    const [fileName, setFileName] = useState(savedState.fileName || 'New Localization');
    const [creationDate, setCreationDate] = useState(savedState.creationDate || new Date().toISOString());
    const [modifiedDate, setModifiedDate] = useState(savedState.modifiedDate || new Date().toISOString());

    useEffect(() => {
        if (initialData.data && !savedState.electrodes) {
            setElectrodes(initialData.data);
        }
        
        // Generate a file ID if none exists
        if (!fileId) {
            setFileId(generateUniqueId());
        }

        // Update file name from saved state
        if (savedState.fileName) {
            setFileName(savedState.fileName);
        }
    }, [initialData, savedState]);

    useEffect(() => {
        onStateChange({
            expandedElectrode,
            submitFlag,
            electrodes,
            fileId,
            fileName,
            creationDate,
            modifiedDate
        });
    }, [expandedElectrode, submitFlag, electrodes, fileId, fileName, creationDate, modifiedDate]);

    // Generate a unique ID for the file - using integer only for database compatibility
    const generateUniqueId = () => {
        // Use timestamp as integer ID (last 9 digits to fit in int4 range)
        return Math.floor(Date.now() % 1000000000);
    };

    const contactTypes = ['GM', 'GM/GM', 'GM/WM', 'WM', 'OOB'];

    const addElectrode = (formData) => {
        // Sanitize inputs by removing commas and semicolons
        const label = formData.get('label').replace(/[,;]/g, '');
        const description = formData.get('description').replace(/[,;]/g, '');
        const numContacts = formData.get('contacts');

        setElectrodes(prevElectrodes => {
            const tempElectrodes = { ...prevElectrodes };
            tempElectrodes[label] = { description: description };
            for (let i = 1; i <= numContacts; i++) {
                tempElectrodes[label][i] = {
                    contactDescription: description,
                    associatedLocation: ''
                };
            }
            return tempElectrodes;
        });

        // Update modification date
        setModifiedDate(new Date().toISOString());
    };

    const handleFileNameChange = (e) => {
        setFileName(e.target.value);
        setModifiedDate(new Date().toISOString());
    };

    const saveFileMetadata = async (userId) => {
        try {
            // Check if file record already exists
            const { data: existingFile } = await supabase
                .from('files')
                .select('*')
                .eq('file_id', fileId)
                .single();

            if (existingFile) {
                // Update existing file record
                const { error } = await supabase
                    .from('files')
                    .update({
                        filename: fileName,
                        modified_date: modifiedDate
                    })
                    .eq('file_id', fileId);

                if (error) throw error;
            } else {
                // Insert new file record
                const { error } = await supabase
                    .from('files')
                    .insert({
                        file_id: fileId,
                        owner_user_id: userId,
                        filename: fileName,
                        creation_date: creationDate,
                        modified_date: modifiedDate
                    });

                if (error) {
                    console.error('File insert error:', error);
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error saving file metadata:', error);
            throw error;
        }
    };

    const getUserId = async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        try {
            const { data: session } = await supabase
                .from('sessions')
                .select('user_id')
                .eq('token', token)
                .single();

            return session?.user_id || null;
        } catch (error) {
            console.error('Error fetching user ID:', error);
            return null;
        }
    };

    const handleSaveLocalization = async (download = false) => {
        try {
            // Update modified date
            const newModifiedDate = new Date().toISOString();
            setModifiedDate(newModifiedDate);
            
            // Get user ID from session
            const userId = await getUserId();
            if (!userId) {
                alert('User not authenticated. Please log in to save localizations.');
                return;
            }
            
            console.log('File ID (integer):', fileId);
            console.log('Electrodes data to save:', electrodes);
            
            // Make sure we have valid data before sending to backend
            if (Object.keys(electrodes).length === 0) {
                alert('No electrode data to save. Please add at least one electrode.');
                return;
            }
            
            try {
                // Save file metadata first
                await saveFileMetadata(userId);
                console.log('File metadata saved successfully');
            } catch (metadataError) {
                console.error('Error saving file metadata:', metadataError);
                alert(`File metadata error: ${metadataError.message}`);
                return;
            }
            
            // Prepare data for sending to backend
            const dataToSend = {
                electrodes: electrodes,
                fileId: fileId
            };
            
            console.log('Sending data to backend:', dataToSend);
            
            // Save localization data with file ID
            const response = await fetch('https://wirecracker-versel.vercel.app:5000/api/save-localization', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
        
            // Get detailed error from response if possible

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', response.status, errorText);
                throw new Error(`Failed to save localization: ${response.status} ${errorText}`);
            }
        
            const result = await response.json();
            console.log('Save successful:', result);

            // Save to CSV
            saveCSVFile(Identifiers.LOCALIZATION, electrodes, download);
            
            // Update tab with latest data
            onStateChange({
                expandedElectrode,
                submitFlag,
                electrodes,
                fileId,
                fileName,
                creationDate,
                modifiedDate
            });
            
            // Show success message
            alert('Localization saved successfully!');
        }
        catch (error) {
            console.error('Error saving localization:', error);
            alert(`Failed to save localization. ${error.message}`);
        }
    };

    const createDesignationTab = () => {
        if (Object.keys(electrodes).length === 0) return;

        // Get designation data from the current localization
        handleSaveLocalization(false);
        const designationData = saveCSVFile(Identifiers.LOCALIZATION, electrodes, false);
        // Create a new tab with the designation data
        const event = new CustomEvent('addDesignationTab', {
            detail: { originalData: electrodes, data: designationData }
        });
        window.dispatchEvent(event);
    };

    const Contact = ({
        label,
        number
    }) => {
        const contactData = electrodes[label][number];
        const associatedLocation = contactData.associatedLocation;

        let displayText = associatedLocation;

        if (associatedLocation === 'GM') {
            displayText = contactData.contactDescription;
        } else if (associatedLocation === 'GM/WM') {
            displayText = `${contactData.contactDescription}/WM`;
        } else if (associatedLocation === 'GM/GM') {
            const [desc1, desc2] = contactData.contactDescription.split('+');
            displayText = `${desc1}/${desc2}`;
        }

        return (
            <Popup
                trigger={<button
                    className="flex flex-col items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-200 min-w-[100px]"
                    key={number}>
                    <div className="text-sm font-medium text-gray-700 w-20 h-5">{number}</div>
                    <div className="text-xs text-gray-500 w-20 h-15">{displayText}</div>
                </button>}
                contentStyle={{ width: "500px" }}
                modal
                nested>
                {close => (
                    <div className="modal bg-white p-6 rounded-lg shadow-lg">
                        <h4 className="text-lg font-semibold mb-4">Add Contact</h4>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md mb-4"
                            onChange={(event) => {
                                let temp = { ...electrodes };
                                temp[label][number].associatedLocation = event.target.value;
                                setElectrodes(temp);
                                setModifiedDate(new Date().toISOString());
                            }}>
                            <option></option>
                            {contactTypes.map((option, i) => {
                                return (
                                    <option key={i}>{option}</option>
                                );
                            })}
                        </select>
                        <button
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
                            onClick={() => {
                                setSubmitFlag(!submitFlag);
                                close();
                            }}>
                            Done
                        </button>
                    </div>
                )}
            </Popup>
        );
    };

    const Electrode = ({
        name
    }) => {
        const [label, setLabel] = useState(name);

        return (
            <div className="w-full bg-white rounded-lg shadow-md mb-5 overflow-hidden">
                <button
                    className="w-full flex justify-between items-center p-4 bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors duration-200"
                    onClick={() => {
                        if (label === expandedElectrode) {
                            setExpandedElectrode('');
                        } else {
                            setExpandedElectrode(label)
                        }
                    }}
                    key={label}>
                    <div className="text-xl">{label}</div>
                    <div className="text-lg">{electrodes[label].description}</div>
                </button>
                {label === expandedElectrode &&
                    <div className="p-4 bg-gray-50">
                        <div className="flex gap-1 flex-wrap overflow-x-auto"> {/* Delete flex-wrap to make it horizontal scroll */}
                            {Object.keys(electrodes[label]).map((key) => {
                                const keyNum = parseInt(key);

                                if (!isNaN(keyNum)) {
                                    return (<Contact label={label} number={key} key={key + label} />);
                                }
                                return null;
                            })}
                        </div>
                    </div>
                }
            </div>
        );
    }

    const Electrodes = () => {
        const orderedKeys = Object.keys(electrodes).sort();

        return (
            <div className="flex flex-col justify-start m-10">
                {orderedKeys.map((key) => { return (<Electrode name={key} key={key} />); })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="p-4">
                <div className="flex justify-between">
                    <div className="flex items-center">
                        <h1 className="text-2xl font-bold">Localization</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            <div>Created: {new Date(creationDate).toLocaleString()}</div>
                            <div>Modified: {new Date(modifiedDate).toLocaleString()}</div>
                        </div>
                        <button
                            className="w-40 bg-sky-700 text-white font-semibold rounded p-2"
                            onClick={() => handleSaveLocalization(true)}
                        >
                            Save Localization
                        </button>
                    </div>
                </div>
                {submitFlag ? <Electrodes /> : <Electrodes />}
            </div>
            <Container>
                <Popup
                    trigger={<Button
                            tooltip="Add a new electrode"
                            styles={{backgroundColor: darkColors.lightBlue, color: lightColors.white}}
                            >
                            <div>+</div>
                        </Button>}
                    contentStyle={{ width: "500px" }}
                    modal
                    nested>
                    {close => (
                        <div className="modal bg-white p-6 rounded-lg shadow-lg">
                            <h4 className="text-lg font-semibold mb-4">
                                Add Electrode
                            </h4>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const formData = new FormData(event.target);

                                    addElectrode(formData);
                                    setSubmitFlag(!submitFlag);
                                    close();
                                }}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Electrode Label</label>
                                    <input name="label" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input name="description" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Contacts</label>
                                    <input type="number" name="contacts" min="0" className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                                <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200">Add</button>
                            </form>
                        </div>
                    )}
                </Popup>
            </Container>

            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
                <button
                    className="py-2 px-4 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors duration-200 shadow-lg"
                    onClick={createDesignationTab}
                >
                    Open in Designation
                </button>
            </div>
        </div>
    );
};

export default Localization;
