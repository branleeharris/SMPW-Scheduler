// src/components/ScheduleDisplay.js
import React from 'react';
import { Calendar, Shuffle, Camera, AlertTriangle } from 'lucide-react';

const ScheduleDisplay = ({
    schedule,
    volunteerMap,
    colors,
    conflicts,
    duplicateError,
    multipleLocations,
    locationNames,
    darkMode,
    audioMode,
    isLoading,
    onUpdateVolunteer,
    onShuffle,
    onExport
}) => {

    if (isLoading && schedule.length === 0) {
         return (
             <div className={`p-4 sm:p-6 rounded-lg shadow-md flex items-center justify-center h-96 ${audioMode ? 'eight-bit-panel' : `${darkMode ? 'bg-gray-800' : 'bg-white'}`}`}>
                  <svg className={`animate-spin h-8 w-8 ${audioMode ? 'text-black' : `${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className={`ml-3 ${audioMode ? 'eight-bit-text' : 'text-lg'}`}>Generating...</span>
             </div>
         );
    }

     if (schedule.length === 0) {
         // Placeholder is handled in ScheduleBuilder.js now
         return null;
     }

    const shiftCounts = schedule[0]?.shiftCounts || {};

    return (
        <div className={`p-4 sm:p-5 rounded-lg shadow-md ${audioMode ? 'eight-bit-panel' : `${darkMode ? 'bg-gray-800' : 'bg-white'}`}`}>
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-3 border-b border-dashed border-gray-300 dark:border-gray-700">
                <h2 className={`text-lg font-semibold flex items-center ${audioMode ? 'eight-bit-heading' : `${darkMode ? 'text-white' : 'text-gray-800'}`}`}>
                    <Calendar className={`mr-2 h-5 w-5 ${audioMode ? '' : `${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}`} />
                    Generated Schedule
                </h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                     <button
                         onClick={onShuffle}
                         disabled={isLoading}
                         className={`button-secondary text-sm ${audioMode ? 'eight-bit-button' : ''} ${isLoading ? 'opacity-50' : ''}`}
                         title="Shuffle Assignments (Keeps Rules)"
                     >
                         <Shuffle size={16} className="mr-1.5" /> Shuffle
                     </button>
                      <button
                         onClick={onExport}
                         className={`button-primary text-sm ${audioMode ? 'eight-bit-button' : ''}`}
                         title="Preview & Export Schedule"
                     >
                         <Camera size={16} className="mr-1.5" /> Export
                     </button>
                </div>
            </div>

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
                <div className={`mb-4 p-3 rounded-md border flex items-start text-sm ${
                    audioMode
                     ? 'eight-bit-box border-yellow-600 bg-yellow-200 text-black'
                     : `${darkMode
                         ? 'bg-yellow-900/50 border-yellow-700/60 text-yellow-200'
                         : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                       }`
                }`}>
                    <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0 text-yellow-500" />
                    <div>
                        <p className={`font-medium ${audioMode ? 'eight-bit-text' : ''}`}>Conflicts Detected!</p>
                        <p className={`mt-1 ${audioMode ? 'eight-bit-text' : ''}`}>Volunteers in <span className={`font-semibold ${audioMode ? '' : 'px-1 py-0.5 rounded bg-red-200 dark:bg-red-800/50'}`}>highlighted</span> cells have back-to-back shifts. Edit the dropdowns to resolve.</p>
                    </div>
                </div>
            )}

             {/* Duplicate Error */}
             {duplicateError && (
                  <div className={`mb-4 p-3 rounded-md border flex items-start text-sm ${
                      audioMode
                       ? 'eight-bit-box border-red-600 bg-red-200 text-black'
                       : `${darkMode
                           ? 'bg-red-900/50 border-red-700/60 text-red-200'
                           : 'bg-red-100 border-red-300 text-red-800'
                         }`
                  }`}>
                     <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0 text-red-500" />
                      <div>
                          <p className={`font-medium ${audioMode ? 'eight-bit-text' : ''}`}>Assignment Error!</p>
                          <p className={`mt-1 ${audioMode ? 'eight-bit-text' : ''}`}>{duplicateError.message} Please select a different volunteer.</p>
                      </div>
                  </div>
             )}


            {/* Shift Count Legend */}
             <div className={`mb-4 p-3 rounded ${audioMode ? 'eight-bit-box' : `${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}`}>
                 <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 ${audioMode ? 'eight-bit-text' : `${darkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>
                     Shift Counts
                 </h3>
                 <div className="flex flex-wrap gap-2">
                     {Object.entries(shiftCounts).map(([volunteerId, count]) => (
                         <span
                             key={volunteerId}
                             className={`px-2 py-0.5 rounded text-xs font-medium inline-flex items-center justify-center min-w-[60px] ${audioMode ? 'volunteer-tag-8bit' : ''}`}
                             style={!audioMode ? {
                                 backgroundColor: colors[volunteerId]?.bg || 'transparent',
                                 color: colors[volunteerId]?.text || 'inherit',
                             } : {
                                  backgroundColor: colors[volunteerId]?.bg || '#FFFFFF', // 8bit defaults
                                  color: colors[volunteerId]?.text || '#000000',
                                  borderColor: darkMode ? '#CCC' : '#000' // Match border to mode
                             }}
                         >
                             {volunteerMap[volunteerId] || volunteerId}: {count}
                         </span>
                     ))}
                 </div>
             </div>

            {/* Schedule Table */}
            <div className={`overflow-x-auto border ${audioMode ? 'eight-bit-box !p-0' : `${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-md`}`}>
                <table className={`min-w-full divide-y ${audioMode ? '' : `${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}`}>
                    {/* Table Head */}
                    <thead className={`${audioMode ? '' : `${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}`}>
                        <tr>
                            <th className={`table-header ${audioMode ? 'eight-bit-text' : ''}`}>Time</th>
                            {multipleLocations ? (
                                locationNames.map((name, locIndex) => (
                                    <th key={locIndex} colSpan={2} className={`table-header text-center ${audioMode ? 'eight-bit-text' : ''}`}>
                                        {audioMode && name.length > 8 ? `${name.substring(0, 7)}…` : name}
                                    </th>
                                ))
                            ) : (
                                <>
                                    <th className={`table-header ${audioMode ? 'eight-bit-text' : ''}`}>Volunteer 1</th>
                                    <th className={`table-header ${audioMode ? 'eight-bit-text' : ''}`}>Volunteer 2</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className={`${audioMode ? '' : `${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}`}>
                        {schedule.map((slot, slotIndex) => (
                            <tr key={slotIndex} className={`${audioMode ? '' : `${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50/50'}`}`}>
                                {/* Time Cell */}
                                <td className={`table-cell font-medium whitespace-nowrap ${audioMode ? 'eight-bit-text !text-[0.65em]' : `${darkMode ? 'text-gray-300' : 'text-gray-700'} text-xs sm:text-sm`}`}>
                                    {slot.display12}
                                </td>

                                {multipleLocations ? (
                                    slot.locations.map((location, locIndex) => (
                                        <React.Fragment key={locIndex}>
                                            {[0, 1].map(volIndex => {
                                                const volunteerId = location.volunteers[volIndex];
                                                 const isConflict = conflicts.some(c => c.slotIndex === slotIndex && c.locationIndex === locIndex && c.volunteerId === volunteerId);
                                                 const isDuplicateErrorSource = duplicateError?.slotIndex === slotIndex && duplicateError?.locationIndex === locIndex;
                                                return (
                                                     <td key={volIndex} className={`table-cell p-1 ${isConflict ? (audioMode ? 'bg-red-300' : 'bg-red-100 dark:bg-red-900/40') : ''}`}>
                                                         <select
                                                             value={volunteerId || ''}
                                                             onChange={(e) => onUpdateVolunteer(slotIndex, volIndex, e.target.value, locIndex)}
                                                             className={`w-full text-xs sm:text-sm px-1.5 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none ${
                                                                audioMode
                                                                 ? 'eight-bit-button !text-[0.7em] !p-1 !shadow-none'
                                                                 : `${darkMode
                                                                     ? 'bg-gray-700 border-gray-600 focus:border-indigo-500'
                                                                     : 'bg-white border-gray-300 focus:border-indigo-500'
                                                                    }`
                                                                } ${isDuplicateErrorSource ? (audioMode ? '!border-red-500' : 'border-red-400 dark:border-red-600 ring-1 ring-red-500') : ''}`
                                                            }
                                                            style={!audioMode && volunteerId ? {
                                                                 backgroundColor: colors[volunteerId]?.bg || 'transparent',
                                                                 color: colors[volunteerId]?.text || 'inherit',
                                                                 borderColor: isConflict ? (darkMode ? '#f87171' : '#fca5a5') : (darkMode ? '#4b5563' : '#d1d5db') // Conflict border color
                                                             } : audioMode && volunteerId ? {
                                                                 backgroundColor: colors[volunteerId]?.bg || '#FFFFFF',
                                                                 color: colors[volunteerId]?.text || '#000000',
                                                                 borderColor: isConflict ? '#FF0000' : (darkMode ? '#CCC' : '#000')
                                                             } : {}}
                                                         >
                                                             <option value="">-- Select --</option>
                                                             {Object.keys(volunteerMap).map(id => (
                                                                 <option key={id} value={id}>
                                                                     {volunteerMap[id]}
                                                                 </option>
                                                             ))}
                                                         </select>
                                                    </td>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))
                                ) : ( // Single Location Cells
                                    [0, 1].map(volIndex => {
                                        const volunteerId = slot.volunteers[volIndex];
                                        const isConflict = conflicts.some(c => c.slotIndex === slotIndex && c.volunteerId === volunteerId);
                                        const isDuplicateErrorSource = duplicateError?.slotIndex === slotIndex;
                                        return (
                                            <td key={volIndex} className={`table-cell p-1 ${isConflict ? (audioMode ? 'bg-red-300' : 'bg-red-100 dark:bg-red-900/40') : ''}`}>
                                               <select
                                                    value={volunteerId || ''}
                                                    onChange={(e) => onUpdateVolunteer(slotIndex, volIndex, e.target.value, null)}
                                                    className={`w-full text-xs sm:text-sm px-1.5 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none ${
                                                        audioMode
                                                         ? 'eight-bit-button !text-[0.7em] !p-1 !shadow-none'
                                                         : `${darkMode
                                                             ? 'bg-gray-700 border-gray-600 focus:border-indigo-500'
                                                             : 'bg-white border-gray-300 focus:border-indigo-500'
                                                            }`
                                                        } ${isDuplicateErrorSource ? (audioMode ? '!border-red-500' : 'border-red-400 dark:border-red-600 ring-1 ring-red-500') : ''}`
                                                    }
                                                    style={!audioMode && volunteerId ? {
                                                        backgroundColor: colors[volunteerId]?.bg || 'transparent',
                                                        color: colors[volunteerId]?.text || 'inherit',
                                                         borderColor: isConflict ? (darkMode ? '#f87171' : '#fca5a5') : (darkMode ? '#4b5563' : '#d1d5db')
                                                    } : audioMode && volunteerId ? {
                                                         backgroundColor: colors[volunteerId]?.bg || '#FFFFFF',
                                                         color: colors[volunteerId]?.text || '#000000',
                                                         borderColor: isConflict ? '#FF0000' : (darkMode ? '#CCC' : '#000')
                                                     } : {}}
                                                >
                                                    <option value="">-- Select --</option>
                                                    {Object.keys(volunteerMap).map(id => (
                                                        <option key={id} value={id}>
                                                            {volunteerMap[id]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        );
                                    })
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Add base table cell/header styles to index.css @layer components
/*
@layer components {
  .table-header {
    @apply px-2 py-2 sm:px-3 sm:py-2.5 text-left text-xs font-semibold uppercase tracking-wider
           text-gray-500 dark:text-gray-400;
  }
  .table-cell {
     @apply px-2 py-1.5 sm:px-3 sm:py-2 text-sm text-gray-900 dark:text-gray-200;
  }
}
*/

export default ScheduleDisplay;