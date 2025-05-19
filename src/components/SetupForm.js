// src/components/SetupForm.js
import React from 'react';
import { Users, Clock, Calendar, Building, Plus, Trash2, ChevronDown, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import { Switch } from '@headlessui/react'; // For toggles

const SetupForm = ({
    volunteers,
    locationName,
    multipleLocations,
    locationNames,
    timeRange,
    dateEnabled,
    smpwMode,
    smpwLocations,
    scripturalPoint,
    darkMode,
    audioMode,
    isLoading,
    onSetupChange,
    onGenerate
}) => {

    const handleVolunteerChange = (index, value) => {
        const newVolunteers = [...volunteers];
        newVolunteers[index] = value;
        onSetupChange('volunteers', newVolunteers);
    };

    const addVolunteer = () => {
        onSetupChange('volunteers', [...volunteers, '']);
    };

    const deleteVolunteer = (index) => {
        if (volunteers.length <= 2 && !multipleLocations) return; // Min 2 for single
        if (volunteers.length <= 4 && multipleLocations) return; // Min 4 for multiple
        const newVolunteers = [...volunteers];
        newVolunteers.splice(index, 1);
        onSetupChange('volunteers', newVolunteers);
    };

     const handleTimeChange = (field, value) => {
         const newTimeRange = { ...timeRange };
         if (field === 'interval') {
             if (value === 'custom') {
                 newTimeRange.isCustomInterval = true;
                 // Keep customInterval or default to 30 if switching
                 newTimeRange.interval = newTimeRange.customInterval || 30;
             } else {
                 newTimeRange.interval = parseInt(value);
                 newTimeRange.isCustomInterval = false;
             }
         } else if (field === 'customInterval') {
              const customVal = parseInt(value) || 30; // Default if empty/invalid
              newTimeRange.customInterval = customVal;
              newTimeRange.interval = customVal; // Sync interval if custom
         } else if (field === 'startTime') {
             newTimeRange.startTime = value;
             // Auto-calculate end time (4 hours later)
             const [hours, minutes] = value.split(':').map(Number);
             let endHours = hours + 4;
             if (endHours >= 24) endHours -= 24;
             newTimeRange.endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
         } else {
             newTimeRange[field] = value;
         }
         onSetupChange('timeRange', newTimeRange);
     };

      const handleLocationNameChange = (index, value) => {
         const newLocationNames = [...locationNames];
         newLocationNames[index] = value;
         onSetupChange('locationNames', newLocationNames);
     };

     const minVolunteers = multipleLocations ? 4 : 2;
     const canDeleteVolunteer = volunteers.length > minVolunteers;

    return (
        <div className={`p-4 sm:p-5 rounded-lg shadow-md ${audioMode ? 'eight-bit-panel' : `${darkMode ? 'bg-gray-800' : 'bg-white'}`}`}>
            <h2 className={`text-lg font-semibold mb-4 flex items-center ${audioMode ? 'eight-bit-heading' : `${darkMode ? 'text-white' : 'text-gray-800'}`}`}>
                <Users className={`mr-2 h-5 w-5 ${audioMode ? '' : `${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}`} />
                Setup
            </h2>

            <div className="space-y-5">
                {/* Location Section */}
                <div className="space-y-3">
                     <label className={`block text-sm font-medium ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                        <Building className="inline-block mr-1.5 mb-0.5 h-4 w-4" />
                        Location Name <span className="text-xs font-normal">(Optional)</span>
                     </label>
                    {smpwMode ? (
                        <select
                            value={locationName}
                            onChange={(e) => onSetupChange('locationName', e.target.value)}
                            className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`} // Use a base class for inputs
                        >
                            <option value="">Select SMPW location...</option>
                            {smpwLocations.map((loc, i) => <option key={i} value={loc}>{loc}</option>)}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={locationName}
                            onChange={(e) => onSetupChange('locationName', e.target.value)}
                            placeholder="e.g., Main Street Cart"
                            className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`}
                        />
                    )}

                    {/* Multiple Locations Toggle */}
                    <Switch.Group as="div" className="flex items-center justify-between pt-2">
                        <Switch.Label className={`text-sm font-medium ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                            {smpwMode ? "Eastern Market Mode" : "Multiple Locations"}
                            <Info
                              size={14}
                              className="inline-block ml-1.5 mb-0.5 text-gray-400 dark:text-gray-500 cursor-help"
                              title={smpwMode ? "Auto-sets locations & needs more volunteers" : "Use for multiple carts/tables simultaneously (min 4 volunteers)"}
                            />
                        </Switch.Label>
                        <Switch
                            checked={multipleLocations}
                            onChange={(checked) => onSetupChange('multipleLocations', checked)}
                             className={`${audioMode ? 'eight-bit-button !p-1 !border-2' : ''} ${
                              multipleLocations ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                        >
                             <span
                              className={`${
                                multipleLocations ? 'translate-x-6' : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                    </Switch.Group>

                    {/* Location Names Input (Conditional) */}
                    {multipleLocations && !smpwMode && (
                        <div className={`pl-4 border-l-2 space-y-2 ${audioMode ? 'border-black ml-2' : `${darkMode ? 'border-gray-700' : 'border-gray-200'}`}`}>
                            {locationNames.map((name, index) => (
                                <div key={index}>
                                     <label className={`block text-xs mb-1 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>
                                         Location {index + 1} Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => handleLocationNameChange(index, e.target.value)}
                                        placeholder={`e.g., Cart ${index + 1}`}
                                        className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`}
                                    />
                                </div>
                            ))}
                             {/* Add logic here if you want to allow adding/removing locations beyond the default 2 */}
                        </div>
                    )}
                </div>

                {/* Date & Time Section */}
                <div className="space-y-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                     {/* Date Toggle */}
                     <Switch.Group as="div" className="flex items-center justify-between">
                         <Switch.Label className={`text-sm font-medium flex items-center ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                             <Calendar className="inline-block mr-1.5 h-4 w-4" /> Include Date
                         </Switch.Label>
                          <Switch
                            checked={dateEnabled}
                            onChange={(checked) => onSetupChange('dateEnabled', checked)}
                            className={`${audioMode ? 'eight-bit-button !p-1 !border-2' : ''} ${
                              dateEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                           >
                             <span
                              className={`${
                                dateEnabled ? 'translate-x-6' : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                             />
                          </Switch>
                     </Switch.Group>

                     {dateEnabled && (
                         <input
                            type="date"
                            value={timeRange.date}
                            onChange={(e) => handleTimeChange('date', e.target.value)}
                            className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`}
                         />
                     )}

                    {/* Time Inputs */}
                    <div>
                         <label className={`block text-sm font-medium mb-1.5 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                             <Clock className="inline-block mr-1.5 mb-0.5 h-4 w-4" /> Shift Time
                         </label>
                        <div className="flex items-center space-x-2">
                            <div className="flex-1">
                                 <label className={`block text-xs mb-1 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>Start</label>
                                <input
                                    type="time"
                                    value={timeRange.startTime}
                                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                                    className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`}
                                />
                            </div>
                            <span className={`pt-5 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-400' : 'text-gray-600'}`}`}>to</span>
                            <div className="flex-1">
                                <label className={`block text-xs mb-1 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>End</label>
                                <input
                                    type="time"
                                    value={timeRange.endTime}
                                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                                     className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Interval Select */}
                    <div>
                        <label className={`block text-sm font-medium mb-1.5 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                             Shift Duration
                        </label>
                         <div className="relative">
                            <select
                                value={timeRange.isCustomInterval ? 'custom' : timeRange.interval}
                                onChange={(e) => handleTimeChange('interval', e.target.value)}
                                className={`w-full input-base appearance-none pr-8 ${audioMode ? 'eight-bit-button' : ''}`} // appearance-none needed for custom arrow
                            >
                                <option value="20">20 minutes</option>
                                <option value="25">25 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="custom">Custom...</option>
                            </select>
                            {!audioMode && ( // Hide default arrow if using 8bit custom one
                                <ChevronDown size={18} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            )}
                        </div>
                        {timeRange.isCustomInterval && (
                            <div className="mt-2">
                                <label className={`block text-xs mb-1 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>
                                    Custom (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="5" max="120" step="5"
                                    value={timeRange.customInterval}
                                    onChange={(e) => handleTimeChange('customInterval', e.target.value)}
                                     className={`w-full input-base ${audioMode ? 'eight-bit-button' : ''}`}
                                />
                            </div>
                        )}
                    </div>
                </div>

                 {/* Scriptural Point (SMPW Mode only) */}
                 {smpwMode && (
                     <div className="pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                         <label className={`block text-sm font-medium mb-1.5 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                            <Info className="inline-block mr-1.5 mb-0.5 h-4 w-4" />
                            Scriptural Point <span className="text-xs font-normal">(Optional)</span>
                         </label>
                         <textarea
                             value={scripturalPoint}
                             onChange={(e) => onSetupChange('scripturalPoint', e.target.value)}
                             placeholder="Share a thought for discussion..."
                             rows="3"
                             className={`w-full input-base resize-none ${audioMode ? 'eight-bit-button' : ''}`} // resize-none prevents user resizing
                         />
                     </div>
                 )}

                 {/* Volunteers Section */}
                 <div className="space-y-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-700">
                    <label className={`block text-sm font-medium ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
                        <Users className="inline-block mr-1.5 mb-0.5 h-4 w-4" />
                        Volunteers <span className="text-xs font-normal">(min {minVolunteers})</span>
                    </label>
                    <div className="space-y-2">
                        {volunteers.map((volunteer, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={volunteer}
                                    onChange={(e) => handleVolunteerChange(index, e.target.value)}
                                    placeholder={`Volunteer ${index + 1}`}
                                    className={`flex-1 input-base ${audioMode ? 'eight-bit-button' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => deleteVolunteer(index)}
                                    disabled={!canDeleteVolunteer}
                                    className={`p-2 rounded transition-colors ${
                                      audioMode
                                        ? 'eight-bit-button !p-1.5 !border-red-600 disabled:!border-gray-400 disabled:!text-gray-400 disabled:opacity-60'
                                        : `${darkMode
                                            ? 'text-red-400 hover:bg-red-900/50 disabled:text-gray-600 disabled:hover:bg-transparent'
                                            : 'text-red-500 hover:bg-red-100 disabled:text-gray-400 disabled:hover:bg-transparent'
                                          }`
                                    }`}
                                    aria-label="Delete volunteer"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                     <button
                        type="button"
                        onClick={addVolunteer}
                        className={`w-full sm:w-auto text-sm button-secondary ${audioMode ? 'eight-bit-button' : ''}`} // Use base button classes
                     >
                         <Plus size={16} className="inline-block mr-1 -ml-1" />
                         Add Volunteer
                     </button>
                 </div>

                 {/* Generate Button */}
                <button
                    type="button"
                    onClick={() => onGenerate(false)} // Pass false for randomize
                    disabled={isLoading || volunteers.filter(v => v.trim()).length < minVolunteers}
                    className={`w-full button-primary mt-4 ${audioMode ? 'eight-bit-button' : ''} ${isLoading || volunteers.filter(v => v.trim()).length < minVolunteers ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Generating...
                        </>
                    ) : "Generate Schedule"}
                </button>
            </div>
        </div>
    );
};

// Define base input/button styles in index.css or here if preferred
// Example (add to index.css @layer components):
/*
@layer components {
  .input-base {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
           placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
           sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400
           dark:focus:ring-indigo-500 dark:focus:border-indigo-500 transition-colors;
  }
  .button-primary {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm
           text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700
           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
           dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
   .button-secondary {
    @apply inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm
           text-sm font-medium text-gray-700 bg-white hover:bg-gray-50
           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
           dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600
           dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
*/

export default SetupForm;