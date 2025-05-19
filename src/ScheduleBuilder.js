// src/ScheduleBuilder.js (Rename App.js)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Users, Calendar, Plus, AlertTriangle, Camera, X, Smartphone, Download, Info, Shuffle, Building, Sun, Moon, Copy, Check, AlertCircle, Volume2, VolumeX, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@headlessui/react'; // For accessible toggles
import { incrementScheduleCounter, getScheduleCount } from './firebase';
import SetupForm from './components/SetupForm';
import ScheduleDisplay from './components/ScheduleDisplay';
import ScreenshotPreviewModal from './components/ScreenshotPreviewModal';
import { generateTimeSlots, createSchedule, formatTo12Hour, formatDate, generateColorsForIds } from './utils/scheduleUtils'; // Move logic

// Import 8-bit CSS
import './8bit.css';

const ScheduleBuilder = () => {
    // --- STATE VARIABLES ---
    // Setup State
    const [volunteers, setVolunteers] = useState(['', '', '', '', '']);
    const [locationName, setLocationName] = useState('');
    const [multipleLocations, setMultipleLocations] = useState(false);
    const [locationNames, setLocationNames] = useState(['Location 1', 'Location 2']); // Keep initial state
    const [timeRange, setTimeRange] = useState({
        startTime: '08:00',
        endTime: '12:00',
        interval: 30,
        isCustomInterval: false,
        customInterval: 30,
        date: new Date().toISOString().split('T')[0]
    });
    const [dateEnabled, setDateEnabled] = useState(false);
    const [scripturalPoint, setScripturalPoint] = useState(""); // For SMPW

    // Schedule State
    const [schedule, setSchedule] = useState([]);
    const [volunteerMap, setVolunteerMap] = useState({});
    const [colors, setColors] = useState({});
    const [conflicts, setConflicts] = useState([]);
    const [duplicateError, setDuplicateError] = useState(null); // { slotIndex, locationIndex?, message }

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [showScreenshotModal, setShowScreenshotModal] = useState(false);
    const [schedulesGenerated, setSchedulesGenerated] = useState(0);

    // Easter Egg State
    const [titleClickCount, setTitleClickCount] = useState(0);
    const [lastTitleClickTime, setLastTitleClickTime] = useState(0);
    const [smpwMode, setSmpwMode] = useState(false);
    const [audioMode, setAudioMode] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);
    const [showActivation, setShowActivation] = useState(false);
    const [activationMessage, setActivationMessage] = useState("");
    const [clickCount, setClickCount] = useState(0); // GIF interaction
    const [pokeSequenceCount, setPokeSequenceCount] = useState(0);
    const [showPokeAnimation, setShowPokeAnimation] = useState(false);
    const [showLowHpAnimation, setShowLowHpAnimation] = useState(false);
    const [showFellAnimation, setShowFellAnimation] = useState(false);

    // Refs
    const audioRef = useRef(null);

    // Constants
    const smpwLocations = [ /* ... keep your locations ... */ ];

    // --- EFFECTS ---

    // Load global schedule count
    useEffect(() => {
        // Keep original Firebase/localStorage logic
        try {
            getScheduleCount(setSchedulesGenerated);
        } catch (error) {
            console.error("Error fetching schedule count:", error);
            const localCount = localStorage.getItem('schedulesGenerated');
            setSchedulesGenerated(localCount ? parseInt(localCount) : 0);
        }
    }, []);

    // Apply Dark Mode Class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Regenerate colors if schedule exists
        if (schedule.length > 0 && Object.keys(volunteerMap).length > 0) {
            setColors(generateColorsForIds(Object.keys(volunteerMap), audioMode, darkMode));
        }
    }, [darkMode, schedule.length, volunteerMap, audioMode]); // Add dependencies

    // Apply 8-bit Mode Class & Font/Scanlines
    useEffect(() => {
        let scanlineEffect = null;
        if (audioMode) {
            // Load font
            const fontLink = document.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            document.head.appendChild(fontLink);

            document.body.classList.add('eight-bit-mode');

            scanlineEffect = document.createElement('div');
            scanlineEffect.className = 'scanline-effect';
            document.body.appendChild(scanlineEffect);

            // Regenerate colors with 8-bit palette
            if (schedule.length > 0 && Object.keys(volunteerMap).length > 0) {
                setColors(generateColorsForIds(Object.keys(volunteerMap), true, darkMode));
            }

            return () => {
                document.body.classList.remove('eight-bit-mode');
                if (scanlineEffect) scanlineEffect.remove();
                 if (fontLink) fontLink.remove();
                // Regenerate normal colors if needed when turning off
                 if (schedule.length > 0 && Object.keys(volunteerMap).length > 0) {
                    setColors(generateColorsForIds(Object.keys(volunteerMap), false, darkMode));
                 }
            };
        } else {
             // Ensure cleanup if audioMode becomes false
             document.body.classList.remove('eight-bit-mode');
             const existingScanline = document.querySelector('.scanline-effect');
             if (existingScanline) existingScanline.remove();
             // Regenerate normal colors
             if (schedule.length > 0 && Object.keys(volunteerMap).length > 0) {
                setColors(generateColorsForIds(Object.keys(volunteerMap), false, darkMode));
             }
        }
    }, [audioMode, schedule.length, volunteerMap, darkMode]); // Add dependencies

    // --- EVENT HANDLERS ---

    const toggleDarkMode = () => setDarkMode(prev => !prev);

    const handleTitleClick = () => {
       // Keep original Easter Egg logic (SMPW/Audio activation)
        const currentTime = new Date().getTime();
        if (currentTime - lastTitleClickTime > 1500 && titleClickCount > 0) {
            setTitleClickCount(0);
        }
        const newCount = titleClickCount + 1;
        setTitleClickCount(newCount);
        setLastTitleClickTime(currentTime);

        if (newCount === 10) {
            setSmpwMode(true);
            setActivationMessage("SMPW Mode Activated!");
            setShowActivation(true);
            setTimeout(() => setShowActivation(false), 2000);
            // Auto-adjust for SMPW if multiple locations isn't already checked
            if (!multipleLocations) {
                setMultipleLocations(true);
                 handleMultipleLocationsChange(true); // Pass true directly
            }
        }
        if (newCount === 30) {
            setAudioMode(true);
            setActivationMessage("8-BIT MODE UNLOCKED!");
            setShowActivation(true);
            setTimeout(() => setShowActivation(false), 2000);
            setTitleClickCount(0); // Reset

            if (audioRef.current && !audioMuted) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.error('Audio playback failed:', e));
            }
        }
    };

    const handleWaveClick = (event) => {
        // Keep original GIF interaction logic
         if (showFellAnimation) return;
         const rect = event.currentTarget.getBoundingClientRect();
         const x = event.clientX - rect.left;
         const width = rect.width;

         if (x < width / 2) {
             const newClickCount = clickCount + 1;
             setClickCount(newClickCount);

             if (newClickCount >= 3) {
                setClickCount(0);
                if (showLowHpAnimation) {
                    setShowLowHpAnimation(false);
                    setShowFellAnimation(true);
                } else if (pokeSequenceCount >= 2) {
                    setShowLowHpAnimation(true);
                    setPokeSequenceCount(pokeSequenceCount + 1);
                    setTimeout(() => setShowLowHpAnimation(false), 2000);
                } else {
                    setShowPokeAnimation(true);
                    setPokeSequenceCount(pokeSequenceCount + 1);
                    setTimeout(() => setShowPokeAnimation(false), 2000);
                }
             }
         }
    };

    const handleSetupChange = (field, value) => {
        // This function will be passed to SetupForm to update state here
        if (field === 'volunteers') setVolunteers(value);
        if (field === 'locationName') setLocationName(value);
        if (field === 'multipleLocations') handleMultipleLocationsChange(value); // Use specific handler
        if (field === 'locationNames') setLocationNames(value);
        if (field === 'timeRange') setTimeRange(prev => ({ ...prev, ...value }));
        if (field === 'dateEnabled') setDateEnabled(value);
        if (field === 'scripturalPoint') setScripturalPoint(value);
        // Add more fields as needed by SetupForm
    };

     // Special handler for multiple locations toggle due to SMPW logic
    const handleMultipleLocationsChange = (isChecked) => {
        setMultipleLocations(isChecked);
        if (smpwMode && isChecked) {
            setLocationNames(["Fisher / Russell", "Market/Winder"]);
            if (volunteers.length < 9) {
                const additionalSlots = 9 - volunteers.length;
                setVolunteers(prev => [...prev, ...Array(additionalSlots).fill('')]);
            }
        }
        // If turning off multiple locations when SMPW is on, reset location names? Or prevent turning off?
        // Let's allow turning off but maybe reset names if they were the SMPW defaults
        else if (smpwMode && !isChecked) {
             if (locationNames[0] === "Fisher / Russell" && locationNames[1] === "Market/Winder") {
                setLocationNames(['Location 1', 'Location 2']); // Reset to generic
             }
        }
    };


    const checkConflicts = useCallback((currentSchedule, currentVolunteerMap) => {
        // Keep original conflict checking logic, but make it a callback
        const newConflicts = [];
        if (!currentSchedule || currentSchedule.length === 0 || !currentVolunteerMap) return;

        currentSchedule.forEach((slot, index) => {
            if (index > 0) {
                const previousSlot = currentSchedule[index - 1];
                if (multipleLocations) {
                    slot.locations.forEach((location, locIndex) => {
                        location.volunteers.forEach(volunteerId => {
                            if (!volunteerId) return;
                            const wasInPreviousSlot = previousSlot.locations.some(
                                prevLoc => prevLoc.volunteers.includes(volunteerId)
                            );
                            if (wasInPreviousSlot) {
                                newConflicts.push({ slotIndex: index, locationIndex: locIndex, volunteerId });
                            }
                        });
                    });
                } else {
                    slot.volunteers.forEach(volunteerId => {
                         if (!volunteerId) return;
                        if (previousSlot.volunteers.includes(volunteerId)) {
                            newConflicts.push({ slotIndex: index, volunteerId });
                        }
                    });
                }
            }
        });
        setConflicts(newConflicts);
    }, [multipleLocations]); // Dependency

    const updateScheduleVolunteer = (slotIndex, volunteerIndex, newVolunteerId, locationIndex = null) => {
        // Keep original logic, but adapted for internal IDs
        const updatedSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy
        let localDuplicateError = null;

        if (multipleLocations && locationIndex !== null) {
            const currentSlot = updatedSchedule[slotIndex];
            const currentLocation = currentSlot.locations[locationIndex];
            const otherIndex = volunteerIndex === 0 ? 1 : 0;

            // Check duplicate within the same shift/location
            if (newVolunteerId && newVolunteerId === currentLocation.volunteers[otherIndex]) {
                localDuplicateError = { slotIndex, locationIndex, message: `${volunteerMap[newVolunteerId] || newVolunteerId} is already in this shift.` };
            }
            // Check duplicate across locations in the same time slot
            else if (newVolunteerId && currentSlot.locations.some((loc, idx) => idx !== locationIndex && loc.volunteers.includes(newVolunteerId))) {
                 localDuplicateError = { slotIndex, locationIndex, message: `${volunteerMap[newVolunteerId] || newVolunteerId} is already assigned elsewhere this slot.` };
            }

            if (localDuplicateError) {
                 setDuplicateError(localDuplicateError);
                 return; // Don't update
            }
            currentLocation.volunteers[volunteerIndex] = newVolunteerId;

        } else { // Single location
            const currentSlot = updatedSchedule[slotIndex];
            const otherIndex = volunteerIndex === 0 ? 1 : 0;
             if (newVolunteerId && newVolunteerId === currentSlot.volunteers[otherIndex]) {
                localDuplicateError = { slotIndex, message: `${volunteerMap[newVolunteerId] || newVolunteerId} is already in this shift.` };
             }

             if (localDuplicateError) {
                 setDuplicateError(localDuplicateError);
                 return; // Don't update
             }
             currentSlot.volunteers[volunteerIndex] = newVolunteerId;
        }

        // Clear any previous error for this specific slot/location being edited
        if (duplicateError && duplicateError.slotIndex === slotIndex && (duplicateError.locationIndex === locationIndex || locationIndex === null)) {
             setDuplicateError(null);
        }

        // Recalculate shift counts
        const newShiftCounts = {};
        Object.keys(volunteerMap).forEach(id => { newShiftCounts[id] = 0; });
        updatedSchedule.forEach(slot => {
            if (multipleLocations) {
                slot.locations.forEach(loc => loc.volunteers.forEach(vId => { if (vId) newShiftCounts[vId]++; }));
            } else {
                slot.volunteers.forEach(vId => { if (vId) newShiftCounts[vId]++; });
            }
        });
        updatedSchedule.forEach(slot => { slot.shiftCounts = newShiftCounts; });


        setSchedule(updatedSchedule);
        checkConflicts(updatedSchedule, volunteerMap); // Pass volunteerMap
    };

    const shouldIncrementCounter = () => {
         // Keep original hourly limit logic
        const lastGenTime = localStorage.getItem('lastScheduleGeneration');
        const currentTime = new Date().getTime();
        if (!lastGenTime || (currentTime - parseInt(lastGenTime) > 3600000)) {
            localStorage.setItem('lastScheduleGeneration', currentTime.toString());
            return true;
        }
        return false;
    };

    const generateSchedule = (randomize = false) => {
        // Keep original generation logic, using imported utils
        const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
        const minVolunteers = multipleLocations ? 4 : 2;
        if (filteredVolunteers.length < minVolunteers) {
            alert(`Please add at least ${minVolunteers} volunteers.`);
            return;
        }

        setIsLoading(true);
        setDuplicateError(null);
        setConflicts([]); // Clear conflicts on new generation

        setTimeout(() => {
            // Create volunteer map (Internal ID -> Display Name)
            const newVolunteerMap = {};
            const internalVolunteers = filteredVolunteers.map((name, index) => {
                const internalId = `v${index}_${name.replace(/\s+/g, '').substring(0, 5)}`; // More robust ID
                newVolunteerMap[internalId] = name.trim();
                return internalId;
            });
            setVolunteerMap(newVolunteerMap);

            // Generate colors
            const newColors = generateColorsForIds(Object.keys(newVolunteerMap), audioMode, darkMode);
            setColors(newColors);

            const intervalValue = timeRange.isCustomInterval ? timeRange.customInterval : parseInt(timeRange.interval);
            const slots = generateTimeSlots(timeRange.startTime, timeRange.endTime, intervalValue, formatTo12Hour, multipleLocations, locationNames);

            // Create schedule using internal IDs
            const { assignments, shiftCounts } = createSchedule(
                internalVolunteers,
                slots,
                randomize,
                multipleLocations,
                locationNames
             );

             // Map assignments back to schedule slots
            const finalSchedule = slots.map((slot, index) => {
                if (multipleLocations) {
                    return {
                        ...slot,
                        locations: locationNames.map((name, locIndex) => ({
                            name,
                            volunteers: assignments[index]?.[locIndex] || []
                        })),
                        shiftCounts
                    };
                } else {
                     return {
                        ...slot,
                        volunteers: assignments[index] || [],
                        shiftCounts
                     };
                }
            });


            setSchedule(finalSchedule);
            checkConflicts(finalSchedule, newVolunteerMap); // Check conflicts immediately
            setIsLoading(false);

             // Increment counter (only on initial generation, not shuffle)
            if (!randomize && shouldIncrementCounter()) {
                try {
                    incrementScheduleCounter()
                        .then(newCount => { if (newCount !== null) setSchedulesGenerated(newCount); })
                        .catch(error => {
                            console.error("Error incrementing counter:", error);
                            const newLocalCount = schedulesGenerated + 1;
                            setSchedulesGenerated(newLocalCount);
                            localStorage.setItem('schedulesGenerated', newLocalCount.toString());
                        });
                } catch (error) { /* ... fallback ... */ }
            }

        }, 300); // Simulate loading
    };

    const shuffleSchedule = () => {
         if (!schedule.length || !volunteerMap || Object.keys(volunteerMap).length === 0) return;
         generateSchedule(true); // Call generate with randomize flag
    };

    const openScreenshotModal = () => {
        if (conflicts.length > 0) {
            alert('Please resolve schedule conflicts before exporting.');
            return;
        }
        if (duplicateError) {
             alert('Please resolve duplicate volunteer assignments before exporting.');
             return;
        }
        setShowScreenshotModal(true);
    };

    // --- RENDER ---
    return (
        <div className={`min-h-screen flex flex-col ${audioMode ? 'eight-bit-container' : ''}`}>
            {/* Audio element */}
            <audio ref={audioRef} src={`${process.env.PUBLIC_URL}/peopleofallsorts.mp3`} loop={audioMode && !audioMuted} />

            {/* Activation Animation Overlay */}
            {showActivation && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-70 backdrop-blur-sm">
                    <div className={`p-6 rounded-lg shadow-xl transform scale-100 animate-pulse ${audioMode ? 'eight-bit-box bg-white text-black' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                        <h2 className={`text-xl md:text-2xl font-bold text-white ${audioMode ? 'eight-bit-text text-black' : ''}`}>{activationMessage}</h2>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className={`sticky top-0 z-30 shadow-md ${audioMode ? 'eight-bit-header' : `bg-gradient-to-r ${darkMode ? 'from-gray-800 to-gray-900' : 'from-white to-gray-100'}`}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <h1
                            className={`text-xl sm:text-2xl font-bold flex items-center cursor-pointer ${audioMode ? 'eight-bit-heading text-white' : `${darkMode ? 'text-white' : 'text-gray-800'}`}`}
                            onClick={handleTitleClick}
                            aria-label="Click title for Easter eggs"
                        >
                            <Calendar className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                            <span>
                                {smpwMode ? (audioMode ? "8-BIT SMPW" : "SMPW Scheduler") : (audioMode ? "8-BIT SCHEDULER" : "Volunteer Scheduler")}
                            </span>
                        </h1>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                           {/* Dark Mode Toggle using Headless UI Switch */}
                           <Switch.Group as="div" className="flex items-center">
                             <Switch.Label className={`mr-2 text-sm ${audioMode ? 'eight-bit-text' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                                <Moon size={16} className="inline-block" />
                              </Switch.Label>
                              <Switch
                                checked={darkMode}
                                onChange={setDarkMode}
                                className={`${audioMode ? 'eight-bit-button !p-1 !border-2' : ''} ${
                                  darkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
                              >
                                <span className="sr-only">Toggle Dark Mode</span>
                                <span
                                  className={`${
                                    darkMode ? 'translate-x-6' : 'translate-x-1'
                                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                              </Switch>
                              <Switch.Label className={`ml-2 text-sm ${audioMode ? 'eight-bit-text' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                                  <Sun size={16} className="inline-block" />
                              </Switch.Label>
                           </Switch.Group>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto max-w-7xl w-full p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                    {/* Setup Form Column */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <SetupForm
                            volunteers={volunteers}
                            locationName={locationName}
                            multipleLocations={multipleLocations}
                            locationNames={locationNames}
                            timeRange={timeRange}
                            dateEnabled={dateEnabled}
                            smpwMode={smpwMode}
                            smpwLocations={smpwLocations}
                            scripturalPoint={scripturalPoint}
                            darkMode={darkMode}
                            audioMode={audioMode}
                            isLoading={isLoading}
                            onSetupChange={handleSetupChange} // Pass handler down
                            onGenerate={generateSchedule}
                        />
                    </div>

                    {/* Schedule Display Column */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <ScheduleDisplay
                            schedule={schedule}
                            volunteerMap={volunteerMap}
                            colors={colors}
                            conflicts={conflicts}
                            duplicateError={duplicateError}
                            multipleLocations={multipleLocations}
                            locationNames={locationNames}
                            darkMode={darkMode}
                            audioMode={audioMode}
                            isLoading={isLoading}
                            onUpdateVolunteer={updateScheduleVolunteer}
                            onShuffle={shuffleSchedule}
                            onExport={openScreenshotModal}
                        />
                         {schedule.length === 0 && !isLoading && (
                            <div className={`mt-6 flex flex-col items-center justify-center h-64 rounded-lg border-2 border-dashed p-6 text-center ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'} ${audioMode ? 'eight-bit-box !border-dashed' : ''}`}>
                               <Calendar size={48} className="mb-4 opacity-50" />
                               <p className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'} ${audioMode ? 'eight-bit-heading' : 'text-lg'}`}>No Schedule Yet</p>
                               <p className={`mt-1 text-sm ${audioMode ? 'eight-bit-text' : ''}`}>Configure settings and click "Generate Schedule".</p>
                            </div>
                         )}
                    </div>
                </div>
            </main>

             {/* Footer */}
            <footer className={`mt-auto pt-6 pb-8 border-t ${audioMode ? 'eight-bit-footer' : `${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                     {audioMode && (
                         <div className="mb-6 flex justify-center">
                             <img
                                src={`${process.env.PUBLIC_URL}/${showFellAnimation ? 'fell.gif' : showLowHpAnimation ? 'lowhp.gif' : showPokeAnimation ? 'poking_brandon.gif' : 'wave.gif'}`}
                                alt="8-bit animation"
                                className="h-32 w-auto max-w-full cursor-pointer pixelated" // Add pixelated class helper
                                onClick={handleWaveClick}
                             />
                         </div>
                     )}
                    <div className="flex flex-col sm:flex-row justify-between items-center text-xs">
                        <p className={audioMode ? 'eight-bit-text' : ''}>
                            v1.6.0 {smpwMode && "(SMPW)"} {audioMode && "8-BIT MODE"}
                        </p>
                         {/* Mute Button for 8-bit Mode */}
                        {audioMode && (
                            <button
                              onClick={() => {
                                setAudioMuted(!audioMuted);
                                if (audioRef.current) {
                                  audioMuted ? audioRef.current.play().catch(e => {}) : audioRef.current.pause();
                                }
                              }}
                              className={`my-2 sm:my-0 p-2 eight-bit-button !border-2 ${darkMode ? '!border-gray-400 !text-gray-300' : ''}`}
                              aria-label={audioMuted ? "Unmute" : "Mute"}
                            >
                              {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                        )}
                        <p className={`mt-1 sm:mt-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'} ${audioMode ? 'eight-bit-text' : ''}`}>
                           {schedulesGenerated > 0 ? `${schedulesGenerated.toLocaleString()} schedules generated globally` : 'Loading count...'}
                        </p>
                    </div>
                </div>
            </footer>

            {/* Screenshot/Export Modal */}
            <ScreenshotPreviewModal
                isOpen={showScreenshotModal}
                onClose={() => setShowScreenshotModal(false)}
                schedule={schedule}
                volunteerMap={volunteerMap}
                colors={colors}
                timeRange={timeRange}
                locationName={locationName}
                locationNames={locationNames}
                multipleLocations={multipleLocations}
                dateEnabled={dateEnabled}
                smpwMode={smpwMode}
                scripturalPoint={scripturalPoint}
                darkMode={darkMode}
                audioMode={audioMode}
                formatTo12Hour={formatTo12Hour} // Pass utils
                formatDate={formatDate}
            />
        </div>
    );
};

export default ScheduleBuilder;