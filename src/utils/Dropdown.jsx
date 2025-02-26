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
 * @param {String} optionRefs List of references for all dropdown menu options separated by spaces
 * @param {String} optionsClassName Classes of dropdown menu item
 * @param {String} menuClassName Classes of full dropdown menu
 */
const Dropdown = ({
    closedText,
    openText = closedText,
    closedClassName,
    openClassName = closedClassName,
    options,
    optionRefs,
    optionClassName,
    menuClassName}) => {
    const [isOpen, setIsOpen] = useState(false);
    const optionsArray = options.split(' ');
    const optionRefsArray = optionRefs.split(' ');
    const menuClasses = "origin-top-right absolute right-0 " + menuClassName;

    return (
        <div className="relative inline-block text-left">
            {isOpen ? (
                <>
                    <button onClick={() => setIsOpen(!isOpen)}
                        className={openClassName}>
                        {openText}
                    </button>
                    <div className={menuClasses}
                        role="menu">
                        <div className="py-1" role="none">
                            {optionsArray.map((option, i) => {
                                if (i < optionRefsArray.length) {
                                    return (
                                        <Link to={optionRefsArray[i]}
                                            key={i}
                                            role="menuItem">
                                            <button onClick={() => setIsOpen(!isOpen)}
                                                className={optionClassName}>
                                                {option}
                                            </button>
                                        </Link>);
                                }
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <button onClick={() => setIsOpen(!isOpen)}
                        className={closedClassName}>
                        {closedText}
                    </button>
                </>
            )}
        </div>
    );
};

export default Dropdown;