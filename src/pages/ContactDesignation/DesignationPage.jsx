import React, { useState, useEffect } from 'react';

const Designation = ({ electrodes, onClick }) => {
    const [filterChar, setFilterChar] = useState('');
    const [filteredElectrodes, setFilteredElectrodes] = useState(electrodes);

    useEffect(() => {
        if (filterChar === '') {
            setFilteredElectrodes(electrodes);
        } else {
            const filtered = electrodes.filter(electrode =>
                electrode.label.toLowerCase().startsWith(filterChar)
            );
            setFilteredElectrodes(filtered);
        }
    }, [electrodes, filterChar]);

    // Handle keydown events
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' || event.key === 'Backspace' || event.keyCode === 8 || event.key.toLowerCase() === filterChar) {
                setFilterChar('');
            } else if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
                const char = event.key.toLowerCase();
                setFilterChar(char);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [filterChar]);

    return (
        <div className="flex-1 p-8 bg-gray-100 min-h-screen">
            <div className="mb-6">
                <p className="text-lg text-gray-700">
                    Filtering electrodes by: {filterChar || 'None'} (Press a key to filter, Esc or Backspace to reset)
                </p>
            </div>
            <ul className="space-y-6">
                {filteredElectrodes.map((electrode) => (
                    <li key={electrode.label} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-gray-800 mb-4">{electrode.label}</p>
                        <ul className="flex flex-wrap gap-4">
                            {electrode.contacts.map((contact) => (
                                <Contact
                                    key={contact.id}
                                    contact={contact}
                                    onClick={onClick}
                                />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Contact = ({ contact, onClick }) => {
    return (
        <li
            className={`w-[100px] p-4 rounded-lg shadow-sm cursor-pointer flex-shrink-0 transition-transform transform hover:scale-105 ${getMarkColor(contact)}`}
            onClick={() => onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    mark: (contact.mark + 1) % 4
                };
            })}
        >
            <p className="text-xl font-bold text-gray-800">{contact.index}</p>
            <p className="text-sm font-medium text-gray-600 truncate" title={contact.associatedLocation}>
                {contact.associatedLocation}
            </p>
        </li>
    );
};

function getMarkColor(contact) {
    let mark = "";
    switch (contact.mark) {
        case 0:
            mark = "bg-white ";
            break;
        case 1:
            mark = "bg-rose-300 ";
            break;
        case 2:
            mark = "bg-amber-300 ";
            break;
        case 3:
            mark = "bg-stone-300 ";
            break;
    }

    if (contact.surgeonMark) {
        mark += "border-2 border-stone-500";
    }
    else {
        mark += "border border-gray-300";
    }
    return mark;
}

export default Designation;
