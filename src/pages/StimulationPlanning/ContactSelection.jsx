import { demoContactData } from "./demoData";
import React, { useState, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const ContactSelection = ({ electrodes = demoContactData }) => {
    const [planningContacts, setPlanningContacts] = useState([]);

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
    };

    const handleDropBackToList = (contact) => {
        setPlanningContacts((prev) => prev.filter((c) => c.id !== contact.id));
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen p-6 space-x-6">
                <ContactList electrodes={electrodes} onDrop={handleDropBackToList} onClick={handleDropToPlanning} droppedContacts={planningContacts} />

                <PlanningPane contacts={planningContacts} onDrop={handleDropToPlanning} onDropBack={handleDropBackToList} />
            </div>
        </DndProvider>
    );
};

const ContactList = ({ electrodes, onDrop, onClick, droppedContacts }) => {
    const [, drop] = useDrop(() => ({
        accept: "CONTACT",
        drop: (item) => onDrop(item),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    return (
        <div className="flex-1" ref={drop}>
            <ul className="space-y-4">
                {electrodes.map((electrode) => (
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        <ul className="flex space-x-4">
                            {electrode.contacts.map((contact, index) => {
                                const contactId = `${electrode.label}${index}`;
                                const shouldAppear = !(droppedContacts.some((c) => c.id === contactId)) && contact.isMarked();
                                return (
                                    shouldAppear && (
                                        <Contact key={contactId}
                                                contact={{ ...contact, id: contactId, electrodeLabel: electrode.label, index: index }}
                                                onClick={onClick} />
                                    )
                                );
                            })}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Contact = ({ contact, onClick }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contact,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <li ref={drag}
            className={`min-w-[100px] p-4 border rounded-lg shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"
            }`}
            onClick={() => onClick(contact)} >
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
            <p className="text-sm text-gray-600">{contact.mark}</p>
            <p className="text-sm text-gray-600">{contact.surgeonMark.toString()}</p>
        </li>
    );
};

const PlanningPane = ({ contacts, onDrop, onDropBack }) => {
    const [hoverIndex, setHoverIndex] = useState(null);

    let index = hoverIndex; // For synchronization between hover and drop

    const [{ isOver }, drop] = useDrop(() => ({
        accept: "CONTACT",
        hover: (item, monitor) => {
            if (!monitor.isOver()) return;
            const clientOffset = monitor.getClientOffset();
            if (!clientOffset) return;
            const hoverY = clientOffset.y;
            let elementSize = 114; // TODO fix this to get value more programmatically
            const newIndex = Math.max(0, Math.floor((hoverY - elementSize / 2) / elementSize));
            setHoverIndex(newIndex);
            index = newIndex;
        },
        drop: (item) => {
            onDrop(item, index);
            setHoverIndex(null);
            index = 0;
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));



    return (
        <div ref={drop} className={`p-4 w-1/4 border-l shadow-lg ${isOver ? "bg-gray-100" : ""}`}>
            <h2 className="text-2xl font-bold mb-4">Planning Pane</h2>
            {contacts.length === 0 ? (
                <p className="text-lg text-gray-500">Drag contacts here</p>
            ) : (
                <ul className="space-y-2 relative">
                    {contacts.map((contact, index) => (
                        <React.Fragment key={contact.id}>
                            {hoverIndex === index && isOver && (
                                <div className="h-1 bg-blue-500 w-full my-1"></div>
                            )}
                            <PlanningContact contact={contact} onDropBack={onDropBack} />
                        </React.Fragment>
                    ))}
                    {hoverIndex >= contacts.length && isOver && (
                        <div className="h-1 bg-blue-500 w-full my-1"></div>
                    )}
                </ul>
            )}
            <button className={`absolute right-10 bottom-10 py-2 px-4 bg-blue-500 text-white font-bold rounded ${
                    contacts.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 border border-blue-700"
                    }`} onClick={() => exportContacts(contacts)}>
                export
            </button>
        </div>
    );
};


const PlanningContact = ({ contact, onDropBack }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: "CONTACT",
        item: contact,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <li ref={drag}
            className={`p-2 border rounded bg-white shadow cursor-pointer ${
                isDragging ? "opacity-50" : "opacity-100"
            }`} >
            <p className="text-lg font-semibold">{contact.id}</p>
            <p className="text-sm text-gray-600">{contact.mark}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
            <button onClick={() => onDropBack(contact)}
                    className="text-red-500 text-sm mt-2 underline" >
                Remove
            </button>
        </li>
    );
};

function exportContacts(contacts) {
    for (let contact of contacts) {
        console.log(contact.id);
    }
}

export default ContactSelection;
