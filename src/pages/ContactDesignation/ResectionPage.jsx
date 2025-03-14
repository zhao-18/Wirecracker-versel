import { parseCSVFile } from '../../utils/CSVParser';
import load_untouch_nii from '../../utils/Nifti_viewer/load_untouch_nifti.js'
import nifti_anatomical_conversion from '../../utils/Nifti_viewer/nifti_anatomical_conversion.js'
import React, { useState, useRef, useEffect, useCallback } from "react";

const Resection = ({ electrodes, onClick, onStateChange, savedState = {} }) => {
    const [imageLoaded, setImageLoaded] = useState(savedState.isLoaded || false);
    const [focusedContact, setFocusedContact] = useState(savedState.focusedContact || null);

    useEffect(() => {
        onStateChange({
            ...savedState,
            layout: "resection",
            //isLoaded: imageLoaded,
            focusedContact: focusedContact
        });
    }, [imageLoaded, focusedContact]);

    return (
        <div className="flex-1">
            <div className="flex flex-col md:flex-row p-2 bg-gray-100">
                <NIFTIimage
                isLoaded={imageLoaded}
                onLoad={setImageLoaded}
                electrodes={electrodes}
                onContactClick={onClick}
                focus={focusedContact}
                onStateChange={onStateChange}
                savedState={savedState} />
                {imageLoaded && (
                    <div className="flex-1 md:ml-6">
                        <div className="h-[870px] overflow-y-auto">
                            <ul className="space-y-6">
                                {electrodes.map((electrode) => (
                                    <li key={electrode.label} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <p className="text-xl font-bold text-gray-800 mb-4">{electrode.label}</p>
                                        <ul className="flex flex-wrap gap-4">
                                            {electrode.contacts.map((contact) => (
                                                <Contact
                                                    key={contact.id}
                                                    contact={contact}
                                                    onClick={onClick}
                                                    setFocus={setFocusedContact}
                                                />
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
            {!imageLoaded && (
                <div className="flex-1 p-8 bg-gray-100 min-h-screen">
                    <ul className="space-y-6">
                        {electrodes.map((electrode) => (
                            <li key={electrode.label} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <p className="text-2xl font-bold text-gray-800 mb-4">{electrode.label}</p>
                                <ul className="flex flex-wrap gap-4">
                                    {electrode.contacts.map((contact) => (
                                        <Contact
                                            key={contact.id}
                                            contact={contact}
                                            onClick={onClick}
                                            setFocus={setFocusedContact}
                                        />
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const NIFTIimage = ({ isLoaded, onLoad, electrodes, onContactClick, focus, onStateChange, savedState = {} }) => {
    const fixedMainViewSize = 600;
    const fixedSubViewSize = 300;

    const [niiData, setNiiData] = useState(null);
//     const [niiData, setNiiData] = useState(savedState.nii || null);
    const [coordinates, setCoordinates] = useState(savedState.coordinate || []);
    const [markers, setMarkers] = useState([]);
    const [sliceIndex, setSliceIndex] = useState(savedState.canvas_main_slice || 0);
    const [maxSlices, setMaxSlices] = useState(savedState.canvas_main_maxSlice || 0);
    const [direction, setDirection] = useState(savedState.canvas_main_direction || 'Axial');
    const [subCanvas0Direction, setSubCanvas0Direction] = useState(savedState.canvas_sub0_direction || 'Coronal');
    const [subCanvas0SliceIndex, setSubCanvas0SliceIndex] = useState(savedState.canvas_sub0_slice || 0);
    const [maxSubCanvas0Slices, setMaxSubCanvas0Slices] = useState(savedState.canvas_sub0_maxSlice || 0);
    const [subCanvas1Direction, setSubCanvas1Direction] = useState(savedState.canvas_sub1_direction || 'Sagittal');
    const [subCanvas1SliceIndex, setSubCanvas1SliceIndex] = useState(savedState.canvas_sub0_slice || 0);
    const [maxSubCanvas1Slices, setMaxSubCanvas1Slices] = useState(savedState.canvas_sub0_maxSlice || 0);
    const [hoveredMarker, setHoveredMarker] = useState(savedState.canvas_hoveredMarker || null);
    const mainCanvasRef = useRef(null);
    const subCanvas0Ref = useRef(null);
    const subCanvas1Ref = useRef(null);
    const imageDataCache = useRef({});

    // Refs to track state without re-binding listeners
    const sliceIndexRef = useRef(sliceIndex);
    const maxSlicesRef = useRef(maxSlices);
    const subCanvas0SliceIndexRef = useRef(subCanvas0SliceIndex);
    const subCanvas1SliceIndexRef = useRef(subCanvas1SliceIndex);
    const maxSubCanvas0SlicesRef = useRef(maxSubCanvas0Slices);
    const maxSubCanvas1SlicesRef = useRef(maxSubCanvas1Slices);

    // Update refs when state changes
    useEffect(() => { sliceIndexRef.current = sliceIndex; }, [sliceIndex]);
    useEffect(() => { maxSlicesRef.current = maxSlices; }, [maxSlices]);
    useEffect(() => { subCanvas0SliceIndexRef.current = subCanvas0SliceIndex; }, [subCanvas0SliceIndex]);
    useEffect(() => { subCanvas1SliceIndexRef.current = subCanvas1SliceIndex; }, [subCanvas1SliceIndex]);
    useEffect(() => { maxSubCanvas0SlicesRef.current = maxSubCanvas0Slices; }, [maxSubCanvas0Slices]);
    useEffect(() => { maxSubCanvas1SlicesRef.current = maxSubCanvas1Slices; }, [maxSubCanvas1Slices]);

    useEffect(() => {
        onStateChange({
            ...savedState,
            canvas_sub1_slice: subCanvas1SliceIndex,
            canvas_sub1_maxSlice: maxSubCanvas1Slices,
            canvas_sub1_direction: subCanvas1Direction,
        });
    }, [subCanvas1SliceIndex, maxSubCanvas1Slices, subCanvas1Direction, isLoaded]);

    useEffect(() => {
        onStateChange({
            ...savedState,
            canvas_sub0_slice: subCanvas0SliceIndex,
            canvas_sub0_maxSlice: maxSubCanvas0Slices,
            canvas_sub0_direction: subCanvas0Direction,
        });
    }, [subCanvas0SliceIndex, maxSubCanvas0Slices, subCanvas0Direction, isLoaded]);

    useEffect(() => {
        onStateChange({
            ...savedState,
            canvas_main_slice: sliceIndex,
            canvas_main_maxSlice: maxSlices,
            canvas_main_direction: direction,
            canvas_hoveredMarker: hoveredMarker,
        });
    }, [sliceIndex, maxSlices, direction, hoveredMarker, isLoaded]);

//     useEffect(() => {
//         if (niiData !== null) {
//             onStateChange({
//                 ...savedState,
//                 nii: niiData
//             });
//         }
//     }, [niiData]);

    useEffect(() => {
        onStateChange({
            ...savedState,
            coordinate: coordinates,
        });
    }, [coordinates]);

    const clearImageDataCache = () => {
        imageDataCache.current = {};
    };

    // Throttled redraw functions using requestAnimationFrame
    const redrawCanvas = (canvasRef, dir, slice, viewSize, cacheKey) => {
        const canvas = canvasRef.current;
        if (!canvas || !niiData) return;

        if (canvas.rafId) cancelAnimationFrame(canvas.rafId);
        canvas.rafId = requestAnimationFrame(() => {
            const ctx = canvas.getContext('2d');
            const cacheEntry = imageDataCache.current[cacheKey];
            if (cacheEntry) {
                ctx.putImageData(cacheEntry, 0, 0);
            } else {
                const imageData = ctx.createImageData(viewSize, viewSize);
                populateImageData(imageData, niiData, dir, slice, viewSize);
                imageDataCache.current[cacheKey] = imageData;
                ctx.putImageData(imageData, 0, 0);
            }
            drawMarkers(ctx, dir, slice, viewSize);
            canvas.rafId = null;
        });
    };

    // Function to transform RAS coordinates to NIfTI coordinates
    const transformCoordinates = (coord) => {
        if (!niiData) return coord; // Return original if NIfTI data is not loaded

        const { hdr } = niiData;
        const dims = hdr.dime.dim;

        // NIfTI dimensions (x, y, z)
        const nx = dims[1] - 1;
        const ny = dims[2] - 1;
        const nz = dims[3] - 1;

        // Transform coordinates (center origin to corner origin)
        return {
            x: coord.x + nx / 2,
            y: coord.y + ny / 2,
            z: coord.z + nz / 2,
            label: coord.Electrode,
            id: coord.Electrode + coord.Contact,
        };
    };

    // Function to draw markers on the canvas
    const drawMarkers = (ctx, dir, slice, viewSize) => {

        if (!niiData || coordinates.length === 0) return;

        const [cols, rows] = getCanvasDimensions(niiData, dir);
        const maxDim = viewSize || Math.max(cols, rows);
        const scale = maxDim / Math.max(cols, rows);
        const offsetX = Math.floor((maxDim - cols * scale) / 2);
        const offsetY = Math.floor((maxDim - rows * scale) / 2);

        const newMarkers = [];

        coordinates.forEach(coord => {
            const transformedCoord = transformCoordinates(coord);
            const { x, y, z } = transformedCoord;
            let canvasX, canvasY;
            switch (dir) {
                case 1:
                    if (Math.round(x) == slice) {
                        canvasX = (y * scale) + offsetX;
                        canvasY = maxDim - (z * scale) - offsetY;
                    }
                    break;
                case 2:
                    if (Math.round(y) == slice) {
                        canvasX = (x * scale) + offsetX;
                        canvasY = maxDim - (z * scale) - offsetY;
                    }
                    break;
                case 3:
                    if (Math.round(z) == slice) {
                        canvasX = (x * scale) + offsetX;
                        canvasY = maxDim - (y * scale) - offsetY;
                    }
                    break;
            }


            if (canvasX !== undefined && canvasY !== undefined) {

                let targetContact;

                for (let electrode of electrodes) {
                    if (electrode.label === transformedCoord.label) {
                        for (let contact of electrode.contacts) {
                            if (contact.id === transformedCoord.id) targetContact = contact;
                        }
                    }
                }

                ctx.beginPath();
                const markSize = viewSize / 100 - 1;
                ctx.arc(canvasX, canvasY, markSize, 0, 2 * Math.PI);

                switch (targetContact.mark) {
                    case 0:
                        ctx.fillStyle = "rgb(249 249 249)"; break;
                    case 1:
                        ctx.fillStyle = "rgb(255 58 68)"; break;
                    case 2:
                        ctx.fillStyle = "rgb(237 255 68)"; break;
                    case 3:
                        ctx.fillStyle = "rgb(139 139 139)"; break;
                }
                ctx.fill();
                if (focus !== null && focus.id === targetContact.id) {
                    ctx.strokeStyle = "rgb(0, 255, 0)"; // Green color for focused contact
                } else {
                    ctx.strokeStyle = targetContact.surgeonMark ? 'black' : ctx.fillStyle;
                }
                ctx.stroke();

                // Store the marker position
                newMarkers.push({ x: canvasX, y: canvasY, contact: targetContact });
            }
        });

        // Update the markers state
        setMarkers(newMarkers);
    };

    const redrawMainCanvas = () => {
        const dir = getDirectionDimension();
        const cacheKey = `main-${dir}-${sliceIndex}-${fixedMainViewSize}`;
        redrawCanvas(mainCanvasRef, dir, sliceIndex, fixedMainViewSize, cacheKey);
    };

    const redrawSubCanvas0 = () => {
        const dir = getDirectionDimension(subCanvas0Direction);
        const cacheKey = `sub-${dir}-${subCanvas0SliceIndex}-${fixedSubViewSize}`;
        redrawCanvas(subCanvas0Ref, dir, subCanvas0SliceIndex, fixedSubViewSize, cacheKey);
    };

    const redrawSubCanvas1 = () => {
        const dir = getDirectionDimension(subCanvas1Direction);
        const cacheKey = `sub-${dir}-${subCanvas1SliceIndex}-${fixedSubViewSize}`;
        redrawCanvas(subCanvas1Ref, dir, subCanvas1SliceIndex, fixedSubViewSize, cacheKey);
    };

    // Effects to redraw canvases when dependencies change
    useEffect(redrawMainCanvas, [sliceIndex, direction, niiData, coordinates, markers]);
    useEffect(redrawSubCanvas0, [subCanvas0SliceIndex, subCanvas0Direction, niiData, coordinates]);
    useEffect(redrawSubCanvas1, [subCanvas1SliceIndex, subCanvas1Direction, niiData, coordinates]);

    // Handle mouse move to detect hover over markers
    const handleMouseMove = (event, canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mouseX = event.offsetX;
        const mouseY = event.offsetY - 12;

        // Check if the mouse is over any marker
        const hovered = markers.find(marker => {
            const distance = Math.sqrt((mouseX - marker.x) ** 2 + (mouseY - marker.y) ** 2);
            return distance <= 6;
        });

        if (hovered) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = 'default';
        }

        setHoveredMarker(hovered ? hovered.contact : hoveredMarker);
    };

    // Handle mouse leave to clear hovered marker
    const handleMouseLeave = () => {
        const canvas = mainCanvasRef.current;
        if (canvas) {
            canvas.style.cursor = 'default'; // Reset cursor to default when mouse leaves the canvas
        }
    };

    const focusOnContact = () => {
        if (!focus) return

        const coord = coordinates.find(c => c.Electrode + c.Contact === focus.id);
        if (!coord || !niiData) return;

        const { x, y, z } = transformCoordinates(coord);

        // Update slice indices to focus on the contact
        switch (getDirectionDimension(direction)) {
            case 1: setSliceIndex(Math.round(x)); break;
            case 2: setSliceIndex(Math.round(y)); break;
            case 3: setSliceIndex(Math.round(z)); break;
        }

        switch (getDirectionDimension(subCanvas0Direction)) {
            case 1: setSubCanvas0SliceIndex(Math.round(x)); break;
            case 2: setSubCanvas0SliceIndex(Math.round(y)); break;
            case 3: setSubCanvas0SliceIndex(Math.round(z)); break;
        }

        switch (getDirectionDimension(subCanvas1Direction)) {
            case 1: setSubCanvas1SliceIndex(Math.round(x)); break;
            case 2: setSubCanvas1SliceIndex(Math.round(y)); break;
            case 3: setSubCanvas1SliceIndex(Math.round(z)); break;
        }
    };
    useEffect(focusOnContact, [focus, niiData, coordinates]);

    // Unified scroll handler using refs
    const handleScroll = (event, setter, currentSliceRef, maxRef) => {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        const newSlice = Math.max(0, Math.min(currentSliceRef.current - delta, maxRef.current - 1));
        setter(newSlice);
    };

    const handleCanvasClick = (event, canvasRef) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const clickX = event.offsetX;
        const clickY = event.offsetY - 12;

        // Check if the click is within any marker's bounds
        markers.forEach(marker => {
            const distance = Math.sqrt((clickX - marker.x) ** 2 + (clickY - marker.y) ** 2);
            if (distance <= 6) {
                onContactClick(marker.contact.id, (contact) => {
                    return {
                        ...contact,
                        surgeonMark: !(contact.surgeonMark)
                    };
                });
                setHoveredMarker(
                    {
                        ...marker.contact,
                        surgeonMark: !(marker.contact.surgeonMark)
                    }
                );
            }
        });
    };

    // Stable event listeners using refs and proper dependencies
    useEffect(() => {
        if (!isLoaded) return;

        const mainCanvas = mainCanvasRef.current;
        const handleWheel = (e) => handleScroll(e, setSliceIndex, sliceIndexRef, maxSlicesRef);
        const handleClick = (e) => handleCanvasClick(e, mainCanvasRef);
        const handleMove = (e) => handleMouseMove(e, mainCanvasRef);
        const handleLeave = () => handleMouseLeave();

        if (mainCanvas) {
            mainCanvas.addEventListener('wheel', handleWheel);
            mainCanvas.addEventListener('click', handleClick);
            mainCanvas.addEventListener('mousemove', handleMove);
            mainCanvas.addEventListener('mouseleave', handleLeave);
            return () => {
                mainCanvas.removeEventListener('wheel', handleWheel);
                mainCanvas.removeEventListener('click', handleClick);
                mainCanvas.removeEventListener('mousemove', handleMove);
                mainCanvas.removeEventListener('mouseleave', handleLeave);
            };
        }
    }, [isLoaded, markers]); // Re-attach when canvas becomes available

    const handleSubCanvasClick = useCallback((clickedSubIndex) => {
        // Get current directions before any updates
        const oldMainDirection = direction;
        const targetSubDirection = clickedSubIndex === 0 ? subCanvas0Direction : subCanvas1Direction;

        const oldMainSliceIndex = sliceIndex;
        let oldSubCanvasSliceIndex;

        // Update main view to clicked subcanvas's direction
        setDirection(targetSubDirection);

        // Update clicked subcanvas to old main direction
        if (clickedSubIndex === 0) {
            oldSubCanvasSliceIndex = subCanvas0SliceIndex;
            setSubCanvas0Direction(oldMainDirection);
            const newMax = niiData.hdr.dime.dim[getDirectionDimension(oldMainDirection)];
            setMaxSubCanvas0Slices(newMax);
            setSubCanvas0SliceIndex(oldMainSliceIndex);
        } else {
            oldSubCanvasSliceIndex = subCanvas1SliceIndex;
            setSubCanvas1Direction(oldMainDirection);
            const newMax = niiData.hdr.dime.dim[getDirectionDimension(oldMainDirection)];
            setMaxSubCanvas1Slices(newMax);
            setSubCanvas1SliceIndex(oldMainSliceIndex);
        }

        // Update main view parameters
        const newMainMax = niiData.hdr.dime.dim[getDirectionDimension(targetSubDirection)];
        setMaxSlices(newMainMax);
        setSliceIndex(oldSubCanvasSliceIndex);
    }, [direction, sliceIndex, subCanvas0SliceIndex, subCanvas1SliceIndex, subCanvas0Direction, subCanvas1Direction, niiData]);

    useEffect(() => {
        if (!isLoaded) return;

        const subCanvas0 = subCanvas0Ref.current;
        const handleWheel = (e) => handleScroll(e, setSubCanvas0SliceIndex, subCanvas0SliceIndexRef, maxSubCanvas0SlicesRef);
        const handleClick = () => handleSubCanvasClick(0);

        if (subCanvas0) {
            subCanvas0.addEventListener('wheel', handleWheel);
            subCanvas0.addEventListener('click', handleClick);
            return () => {
                subCanvas0.removeEventListener('wheel', handleWheel);
                subCanvas0.removeEventListener('click', handleClick);
            };
        }
    }, [isLoaded, handleSubCanvasClick]); // Include direction in dependencies

    useEffect(() => {
        if (!isLoaded) return;

        const subCanvas1 = subCanvas1Ref.current;
        const handleWheel = (e) => handleScroll(e, setSubCanvas1SliceIndex, subCanvas1SliceIndexRef, maxSubCanvas1SlicesRef);
        const handleClick = () => handleSubCanvasClick(1);

        if (subCanvas1) {
            subCanvas1.addEventListener('wheel', handleWheel);
            subCanvas1.addEventListener('click', handleClick);
            return () => {
                subCanvas1.removeEventListener('wheel', handleWheel);
                subCanvas1.removeEventListener('click', handleClick);
            };
        }
    }, [isLoaded, handleSubCanvasClick]); // Include direction in dependencies

    const getDirectionDimension = (dir = direction) => {
        switch(dir) {
            case 'Axial': return 3;
            case 'Coronal': return 2;
            case 'Sagittal': return 1;
            default: return 3;
        }
    };

    const handleNIfTIFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            let nii = load_untouch_nii(file.name, arrayBuffer);
            nii = nifti_anatomical_conversion(nii);
            nii = {
                img: nii.img,
                hdr: nii.hdr
            }

            const isRGB = (nii.hdr.dime.datatype === 128 && nii.hdr.dime.bitpix === 24) ||
                    (nii.hdr.dime.datatype === 511 && nii.hdr.dime.bitpix === 96);
            setNiiData({ ...nii, isRGB });

            const slices = nii.hdr.dime.dim[getDirectionDimension()];
            const subCanvas0Slices = nii.hdr.dime.dim[getDirectionDimension(subCanvas0Direction)];
            const subCanvas1Slices = nii.hdr.dime.dim[getDirectionDimension(subCanvas1Direction)];

            setMaxSlices(slices);
            setMaxSubCanvas0Slices(subCanvas0Slices);
            setMaxSubCanvas1Slices(subCanvas1Slices);

            setSliceIndex(Math.floor(slices / 2));
            setSubCanvas0SliceIndex(Math.floor(subCanvas0Slices / 2));
            setSubCanvas1SliceIndex(Math.floor(subCanvas1Slices / 2));

            clearImageDataCache();

            setHoveredMarker(null);

            onLoad(true);
        } catch (error) {
            console.error('Error loading NIfTI file:', error);
        }
    };

    const handleCSVFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const { identifier, data } = await parseCSVFile(file, true);
            if (identifier === "coordinates") {
                // Check for columns
                if (Array.isArray(data)
                    && data.length > 0
                    && data[0].Electrode
                    && data[0].Contact
                    && data[0].x
                    && data[0].y
                    && data[0].z) {
                    setCoordinates(data); // Store CSV coordinates in state
                } else {
                    throw "Please check the column name of the CSV data. Required: [Electrode,Contact,x,y,z]"
                }
            } else {
                throw "Unknown CSV file format"
            }
        } catch (err) {
            console.error('Error parsing CSV file:', err);
        }
        setHoveredMarker(null);
    };

    const getCanvasDimensions = (nii, dir) => {
        switch(dir) {
            case 1: return [nii.hdr.dime.dim[2], nii.hdr.dime.dim[3]];
            case 2: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[3]];
            case 3: return [nii.hdr.dime.dim[1], nii.hdr.dime.dim[2]];
            default: return [fixedMainViewSize, fixedMainViewSize];
        }
    };

    const populateImageData = (imageData, nii, dir, slice, imageSize) => {
        const [cols, rows] = getCanvasDimensions(nii, dir);
        const maxDim = imageSize || Math.max(cols, rows);

        let scaleX, scaleY;

        switch(dir) {
            case 3:
                scaleX = nii.hdr.dime.pixdim[1];
                scaleY = nii.hdr.dime.pixdim[2];
                break;
            case 2:
                scaleX = nii.hdr.dime.pixdim[1];
                scaleY = nii.hdr.dime.pixdim[3];
                break;
            case 1:
                scaleX = nii.hdr.dime.pixdim[2];
                scaleY = nii.hdr.dime.pixdim[3];
                break;
        }

        const effectiveCols = cols * scaleX;
        const effectiveRows = rows * scaleY;

        const scale = maxDim / Math.max(effectiveCols, effectiveRows);

        const isRGB = nii.isRGB;
        const data = imageData.data;

        // Calculate the offsets to center the image
        const offsetX = Math.floor((maxDim - effectiveCols * scale) / 2);
        const offsetY = Math.floor((maxDim - effectiveRows * scale) / 2);

        // Initialize the entire imageData with black pixels
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 255; // A (fully opaque)
        }

        // Precompute row and column mappings)
        const rowMap = new Array(maxDim).fill().map((_, row) => Math.floor((maxDim - 1 - row - offsetY) / scale / scaleY));
        const colMap = new Array(maxDim).fill().map((_, col) => Math.floor((col + offsetX) / scale / scaleX));

        for (let y = 0; y < maxDim; y++) {
            const originalY = rowMap[y];
            for (let x = 0; x < maxDim; x++) {
                const originalX = colMap[x];
                let pixelValue = 0;

                // Only process pixels within the bounds of the original image
                if (originalX >= 0 && originalX < cols && originalY >= 0 && originalY < rows) {
                    try {
                        switch(dir) {
                            case 1: pixelValue = nii.img[originalY][originalX][slice]; break;
                            case 2: pixelValue = nii.img[originalY][slice][originalX]; break;
                            case 3: pixelValue = nii.img[slice][originalY][originalX]; break;
                        }
                    } catch(e) {
                        console.warn(`Error accessing NIfTI data at [${originalX}, ${originalY}, ${slice}]`);
                        pixelValue = 0;
                    }
                }

                const offset = (y * maxDim + x) * 4;
                if (isRGB) {
                    data.set(pixelValue, offset);
                } else {
                    const val = (pixelValue / nii.hdr.dime.glmax) * 255;
                    data[offset] = data[offset+1] = data[offset+2] = val;
                }
                data[offset+3] = 255;
            }
        }
    };

    return (
        <div className="p-2 bg-gray-100">
            <div className="flex space-x-4 mb-8">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileUpload}
                    style={{ display: 'none' }}
                    id="coorInput"
                />
                <button
                    className="border-solid border-2 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 hover:bg-sky-700 hover:text-white transition-colors duration-200"
                    onClick={() => document.getElementById('coorInput').click()}
                >
                    Open Coordinate File
                </button>
                <input
                    type="file"
                    accept=".nii"
                    onChange={handleNIfTIFileUpload}
                    style={{ display: 'none' }}
                    id="niftiInput"
                />
                <button
                    className="border-solid border-2 border-sky-700 text-sky-700 font-semibold rounded-xl w-64 h-12 hover:bg-sky-700 hover:text-white transition-colors duration-200"
                    onClick={() => document.getElementById('niftiInput').click()}
                >
                    Open NIfTI File
                </button>
            </div>
            {isLoaded && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
                        <canvas ref={mainCanvasRef} width={fixedMainViewSize} height={fixedMainViewSize} className="border border-gray-300 rounded-lg shadow-sm" />
                        <div className="flex flex-col space-y-6">
                            <canvas ref={subCanvas0Ref} width={fixedSubViewSize} height={fixedSubViewSize} className="border border-gray-300 rounded-lg shadow-sm" />
                            <canvas ref={subCanvas1Ref} width={fixedSubViewSize} height={fixedSubViewSize} className="border border-gray-300 rounded-lg shadow-sm" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4 h-32">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                            {hoveredMarker !== null ? hoveredMarker.id : "Hover over on contact to see information..."}
                        </h2>
                        <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="text-sm text-gray-600">Location</p>
                                <p className="text-lg font-medium text-gray-900 truncate" title={hoveredMarker !== null ? hoveredMarker.associatedLocation : ""}>
                                    {hoveredMarker !== null ? hoveredMarker.associatedLocation : ""}
                                </p>
                            </div>
                            <div className="flex-shrink-0 px-4 min-w-[200px]">
                                <p className="text-sm text-gray-600">Mark</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {hoveredMarker !== null ? getMarkName(hoveredMarker) : ""}
                                </p>
                            </div>
                            <div className="flex-shrink-0 pl-4 min-w-[50px]">
                                <p className="text-sm text-gray-600">Surgeon Marked</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {hoveredMarker !== null ? (hoveredMarker.surgeonMark ? 'Yes' : 'No') : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Contact = ({ contact, onClick, setFocus }) => {
    const [clickCount, setClickCount] = useState(0);

    useEffect(() => {
        let singleClickTimer;

        if (clickCount === 1) {
        singleClickTimer = setTimeout(() => {
            onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    surgeonMark: !(contact.surgeonMark)
                };
            });
            setClickCount(0);
        }, 200); // Delay to differentiate between single and double clicks
        } else if (clickCount === 2) {
            onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    focus: true
                };
            });
            setClickCount(0);
            setFocus(contact);
        }


        return () => clearTimeout(singleClickTimer);
    }, [clickCount]);

    return (
        <li
            className={`w-[100px] p-4 rounded-lg shadow-sm cursor-pointer flex-shrink-0 transition-transform transform hover:scale-105 ${getMarkColor(contact)}`}
            onClick={() => setClickCount(clickCount + 1)}
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

function getMarkName(contact) {
    switch (contact.mark) {
        case 0:
            return "Not Involved";
        case 1:
            return "Seizure Onset Zone";
        case 2:
            return "Seizure Network";
        case 3:
            return "Out Of Brain";
    }
}

export default Resection
