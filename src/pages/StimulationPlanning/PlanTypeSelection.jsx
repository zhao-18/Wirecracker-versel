import { useEffect } from "react";

const PlanTypePage = ({ initialData = {}, onStateChange, switchContent }) => {
    // Parse CSV and put into a format that contact selection can use.
    useEffect(() => {
        onStateChange({electrodes: initialData.data});
    }, [initialData]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="grid gap-6">
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => switchContent('seizure-recreation')}>
                    Seizure Recreation
                </button>
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => switchContent('cceps')}>
                    CCEPs
                </button>
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => switchContent('functional-mapping')}>
                    Functional Mapping
                </button>
            </div>
        </div>
    );
};

export default PlanTypePage;
