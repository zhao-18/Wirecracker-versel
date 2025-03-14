import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Based off dropdown example from https://www.geeksforgeeks.org/create-dropdowns-ui-using-react-and-tailwind-css/
/**
 * Generates a dropdown menu
 * 
 * @param {String} closedText Text in button when dropdown is closed
 * @param {String} openText Text in button when dropdown is open
 * @param {String} closedClassName Classes of button when dropdown is closed
 * @param {String} openClassName Classes of button when dropdown is open
 * @param {String} options List of all dropdown menu options separated by spaces
 * @param {String} optionClassName Classes of dropdown menu item
 * @param {String} menuClassName Classes of full dropdown menu
 * @param {Function} onOptionClick Callback function to handle option click
 */
const Dropdown = ({
    closedText,
    openText,
    closedClassName,
    openClassName,
    options,
    optionClassName,
    menuClassName,
    onOptionClick
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const optionsList = options.split(" ");

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={isOpen ? openClassName : closedClassName}
            >
                {isOpen ? openText : closedText}
            </button>

            {isOpen && (
                <div className={`absolute top-full left-0 z-50 mt-1 ${menuClassName}`}>
                    <div className="py-1" role="none">
                        {optionsList.map((option, index) => (
                            <button
                                key={index}
                                className={optionClassName}
                                onClick={() => {
                                    onOptionClick(option);
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;