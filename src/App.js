import React, { useState, useRef } from 'react';
import { Clock, Users, Calendar, ChevronDown, Plus, AlertTriangle, Camera, X, Smartphone, Download } from 'lucide-react';

const ScheduleBuilder = () => {
  const [volunteers, setVolunteers] = useState(['', '', '', '', '']);
  const [timeRange, setTimeRange] = useState({ 
    startTime: '16:00', 
    endTime: '20:00', 
    interval: 30,
    date: new Date().toISOString().split('T')[0]
  });
  const [schedule, setSchedule] = useState([]);
  const [colors, setColors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [duplicateError, setDuplicateError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  
  // Handle volunteer input change
  const handleVolunteerChange = (index, value) => {
    const newVolunteers = [...volunteers];
    newVolunteers[index] = value;
    setVolunteers(newVolunteers);
  };
  
  // Handle time range changes
  const handleTimeChange = (field, value) => {
    setTimeRange(prev => ({ ...prev, [field]: value }));
  };
  
  // Add a new volunteer field
  const addVolunteer = () => {
    setVolunteers([...volunteers, '']);
  };
  
  // Convert 24h time to 12h format
  const formatTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };
  
  // Format date in a readable way
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Generate colors for volunteers
  const generateColors = (volunteers) => {
    const colorMap = {};
    const colorPalette = [
      { bg: '#e9f2fc', text: '#1a56db' }, // Blue
      { bg: '#faebd7', text: '#c2410c' }, // Orange
      { bg: '#edf7ed', text: '#15803d' }, // Green
      { bg: '#fce7f3', text: '#be185d' }, // Pink
      { bg: '#f3e8ff', text: '#7e22ce' }, // Purple
      { bg: '#e6fffa', text: '#0d9488' }, // Teal
      { bg: '#fff7ed', text: '#c2410c' }, // Amber
      { bg: '#f1f5f9', text: '#475569' }, // Gray
      { bg: '#f0fdfa', text: '#059669' }, // Emerald
      { bg: '#fdf2f8', text: '#db2777' }  // Rose
    ];
    
    volunteers.forEach((volunteer, index) => {
      if (volunteer.trim() !== '') {
        colorMap[volunteer] = colorPalette[index % colorPalette.length];
      }
    });
    
    return colorMap;
  };
  
  // Generate time slots
  const generateTimeSlots = (startTime, endTime, interval) => {
    const slots = [];
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      let nextMinute = currentMinute + interval;
      let nextHour = currentHour;
      
      if (nextMinute >= 60) {
        nextHour += Math.floor(nextMinute / 60);
        nextMinute = nextMinute % 60;
      }
      
      if (nextHour > endHour || (nextHour === endHour && nextMinute > endMinute)) {
        break;
      }
      
      const endTimeString = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
      
      slots.push({
        startTime: timeString,
        endTime: endTimeString,
        display12: `${formatTo12Hour(timeString)} - ${formatTo12Hour(endTimeString)}`,
        compactDisplay: `${formatTo12Hour(timeString)}-${formatTo12Hour(endTimeString)}`,
        volunteers: []
      });
      
      currentHour = nextHour;
      currentMinute = nextMinute;
    }
    
    return slots;
  };
  
  // Check if a volunteer is already scheduled in the current or previous slot
  const isVolunteerAvailable = (volunteer, slotIndex, assignedVolunteers) => {
    if (slotIndex > 0) {
      const previousSlot = assignedVolunteers[slotIndex - 1];
      if (previousSlot.includes(volunteer)) {
        return false;
      }
    }
    return true;
  };
  
  // Create schedule with even workload and maximized variety
  const createSchedule = (volunteers, slots) => {
    const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
    
    // Track pairings for variety
    const pairCounts = {};
    filteredVolunteers.forEach(v1 => {
      filteredVolunteers.forEach(v2 => {
        if (v1 !== v2) {
          pairCounts[`${v1}-${v2}`] = 0;
        }
      });
    });
    
    // Track shift counts for even workload
    const shiftCounts = {};
    filteredVolunteers.forEach(v => {
      shiftCounts[v] = 0;
    });
    
    const assignedVolunteers = slots.map(() => []);
    
    // First pass: Assign volunteers with availability constraint
    slots.forEach((slot, slotIndex) => {
      // Find available volunteers
      const availableVolunteers = filteredVolunteers.filter(v => 
        isVolunteerAvailable(v, slotIndex, assignedVolunteers)
      );
      
      if (availableVolunteers.length < 2) {
        // Not enough available volunteers, will handle in second pass
        return;
      }
      
      // Sort by shift count (ascending) to prioritize even workload
      availableVolunteers.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
      
      // Select first volunteer (least shifts)
      const firstVolunteer = availableVolunteers[0];
      
      // Find best partner for variety (ensuring it's not the same volunteer)
      let bestPartner = null;
      let lowestPairCount = Infinity;
      
      for (let i = 1; i < availableVolunteers.length; i++) {
        const partner = availableVolunteers[i];
        // Skip if it's the same volunteer
        if (partner === firstVolunteer) continue;
        
        const pairKey = `${firstVolunteer}-${partner}`;
        const reversePairKey = `${partner}-${firstVolunteer}`;
        const pairCount = (pairCounts[pairKey] || 0) + (pairCounts[reversePairKey] || 0);
        
        if (pairCount < lowestPairCount) {
          lowestPairCount = pairCount;
          bestPartner = partner;
        }
      }
      
      // Assign volunteers
      if (bestPartner) {
        assignedVolunteers[slotIndex] = [firstVolunteer, bestPartner];
        shiftCounts[firstVolunteer]++;
        shiftCounts[bestPartner]++;
        pairCounts[`${firstVolunteer}-${bestPartner}`]++;
        pairCounts[`${bestPartner}-${firstVolunteer}`]++;
      }
    });
    
    // Second pass: Fill in any slots that couldn't be filled with availability constraint
    slots.forEach((slot, slotIndex) => {
      if (assignedVolunteers[slotIndex].length < 2) {
        const sortedVolunteers = [...filteredVolunteers].sort((a, b) => shiftCounts[a] - shiftCounts[b]);
        
        // Fill first position if needed
        if (assignedVolunteers[slotIndex].length === 0 && sortedVolunteers.length > 0) {
          const firstVolunteer = sortedVolunteers.shift();
          assignedVolunteers[slotIndex].push(firstVolunteer);
          shiftCounts[firstVolunteer]++;
        }
        
        // Fill second position, ensuring it's different from the first
        if (assignedVolunteers[slotIndex].length === 1) {
          const firstVolunteer = assignedVolunteers[slotIndex][0];
          // Find a different volunteer for second position
          const availableForSecond = sortedVolunteers.filter(v => v !== firstVolunteer);
          
          if (availableForSecond.length > 0) {
            const secondVolunteer = availableForSecond[0];
            assignedVolunteers[slotIndex].push(secondVolunteer);
            shiftCounts[secondVolunteer]++;
          } else if (sortedVolunteers.length > 0) {
            // If all remaining volunteers are the same as the first (unlikely),
            // just make sure we add a second different volunteer somehow
            for (const v of filteredVolunteers) {
              if (v !== firstVolunteer) {
                assignedVolunteers[slotIndex].push(v);
                shiftCounts[v]++;
                break;
              }
            }
          }
        }
      }
    });
    
    return { assignments: assignedVolunteers, shiftCounts };
  };
  
  // Generate the schedule
  const generateSchedule = () => {
    const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
    
    if (filteredVolunteers.length < 2) {
      alert('Please add at least 2 volunteers');
      return;
    }
    
    setIsLoading(true);
    setDuplicateError(null);
    
    // Simulate loading for better UX
    setTimeout(() => {
      // Generate colors
      const colorMap = generateColors(filteredVolunteers);
      setColors(colorMap);
      
      // Generate time slots
      const slots = generateTimeSlots(
        timeRange.startTime, 
        timeRange.endTime, 
        parseInt(timeRange.interval)
      );
      
      // Create schedule
      const { assignments, shiftCounts } = createSchedule(filteredVolunteers, slots);
      
      // Create final schedule
      const newSchedule = slots.map((slot, index) => ({
        ...slot,
        volunteers: assignments[index],
        shiftCounts
      }));
      
      setSchedule(newSchedule);
      setConflicts([]);
      setIsLoading(false);
    }, 500);
  };
  
  // Update a volunteer in the schedule
  const updateScheduleVolunteer = (slotIndex, volunteerIndex, newVolunteer) => {
    const updatedSchedule = [...schedule];
    const currentSlot = updatedSchedule[slotIndex];
    
    // Check if this would create a duplicate in the same shift
    const otherIndex = volunteerIndex === 0 ? 1 : 0;
    if (newVolunteer && newVolunteer === currentSlot.volunteers[otherIndex]) {
      setDuplicateError({
        slotIndex,
        message: `${newVolunteer} is already assigned to this shift`
      });
      return; // Don't update if it would create a duplicate
    }
    
    // Clear any existing duplicate error
    if (duplicateError && duplicateError.slotIndex === slotIndex) {
      setDuplicateError(null);
    }
    
    // Update the volunteer
    updatedSchedule[slotIndex].volunteers[volunteerIndex] = newVolunteer;
    
    // Update shift counts
    const shiftCounts = {};
    const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
    filteredVolunteers.forEach(v => { shiftCounts[v] = 0; });
    
    updatedSchedule.forEach(slot => {
      slot.volunteers.forEach(v => {
        if (v && shiftCounts[v] !== undefined) {
          shiftCounts[v]++;
        }
      });
    });
    
    // Update the schedule with new shift counts
    updatedSchedule.forEach(slot => {
      slot.shiftCounts = shiftCounts;
    });
    
    setSchedule(updatedSchedule);
    checkConflicts(updatedSchedule);
  };
  
  // Check for scheduling conflicts
  const checkConflicts = (updatedSchedule) => {
    const newConflicts = [];
    
    updatedSchedule.forEach((slot, index) => {
      if (index > 0) {
        const previousSlot = updatedSchedule[index - 1];
        
        slot.volunteers.forEach(volunteer => {
          if (previousSlot.volunteers.includes(volunteer)) {
            newConflicts.push({
              slotIndex: index,
              volunteer: volunteer
            });
          }
        });
      }
    });
    
    setConflicts(newConflicts);
  };
  
  // Enter screenshot mode
  const enterScreenshotMode = () => {
    if (conflicts.length > 0) {
      alert('Please resolve all scheduling conflicts before creating a screenshot.');
      return;
    }
    
    if (duplicateError) {
      alert('Please resolve the duplicate volunteer assignment before creating a screenshot.');
      return;
    }
    
    setScreenshotMode(true);
    setShowSaveInstructions(false);
  };
  
  // Show save instructions modal
  const showSaveHelp = () => {
    setShowSaveInstructions(true);
  };
  
  // The compact screenshot view component optimized for mobile
  const ScreenshotView = () => {
    if (!schedule.length) return null;
    
    const dateStr = formatDate(timeRange.date);
    const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
    const shiftCounts = schedule[0]?.shiftCounts || {};
    
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="relative max-w-md mx-auto">
          {/* Controls - positioned outside the screenshot area */}
          <div className="absolute top-1 right-1 flex space-x-1">
            <button 
              onClick={showSaveHelp}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => setScreenshotMode(false)}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Screenshot area - this is the part to be captured */}
          <div className="pt-8 pb-2 px-3">
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="text-lg font-bold text-gray-800">SMPW Schedule</h1>
              <p className="text-xs text-gray-600">{dateStr} • {timeStr}</p>
            </div>
            
            {/* Compact Schedule Table */}
            <table className="w-full border-collapse border border-gray-300 text-xs mb-2">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 py-1 px-1 text-left font-medium">
                    Time
                  </th>
                  <th className="border border-gray-300 py-1 px-1 text-center font-medium">
                    Volunteers
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((slot, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 py-1 px-1 whitespace-nowrap font-medium">
                      {slot.compactDisplay}
                    </td>
                    <td className="border border-gray-300 py-1 px-1">
                      <div className="flex justify-center items-center gap-1">
                        {slot.volunteers.map((volunteer, vIndex) => (
                          <span 
                            key={vIndex}
                            className="inline-block px-1 py-0.5 rounded-sm text-center"
                            style={{ 
                              backgroundColor: colors[volunteer]?.bg || 'transparent',
                              color: colors[volunteer]?.text || 'inherit',
                              width: '45%',
                              fontSize: '0.7rem'
                            }}
                          >
                            {volunteer}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Legend - If there's space */}
            <div className="text-xs mb-1">
              <div className="flex flex-wrap gap-1">
                {Object.keys(shiftCounts).map((volunteer, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center rounded-sm px-1 py-0.5"
                    style={{ 
                      backgroundColor: colors[volunteer]?.bg || 'transparent',
                      color: colors[volunteer]?.text || 'inherit',
                      fontSize: '0.7rem'
                    }}
                  >
                    {volunteer}:{shiftCounts[volunteer]}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center text-gray-500 text-xs mt-1">
              SMPW Program
            </div>
          </div>
        </div>
        
        {/* Save Instructions Modal */}
        {showSaveInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm mx-auto">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Smartphone className="mr-2" size={20} />
                Save as Image
              </h3>
              <div className="mb-4">
                <p className="mb-2 text-sm">To save this schedule as an image:</p>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  <li>Take a screenshot on your phone</li>
                  <li>For iPhone: Press power button + volume up</li>
                  <li>For Android: Press power button + volume down</li>
                  <li>Then crop the image as needed</li>
                </ol>
              </div>
              <button 
                onClick={() => setShowSaveInstructions(false)}
                className="w-full py-2 bg-indigo-600 text-white rounded-md"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-4 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center">
            <Calendar className="mr-3" />
            SMPW Volunteer Schedule
          </h1>
        </div>
      </header>
      
      {screenshotMode && <ScreenshotView />}
      
      <main className="py-6 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Setup Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="mr-2 text-indigo-600" size={20} />
              Setup
            </h2>
            
            <div className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline-block mr-1 mb-0.5" size={16} />
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={timeRange.date}
                  onChange={(e) => handleTimeChange('date', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline-block mr-1 mb-0.5" size={16} />
                  Time Range
                </label>
                <div className="flex items-center space-x-2">
                  <div className="w-full">
                    <input
                      type="time"
                      value={timeRange.startTime}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-gray-500">to</span>
                  <div className="w-full">
                    <input
                      type="time"
                      value={timeRange.endTime}
                      onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Shift Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline-block mr-1 mb-0.5" size={16} />
                  Shift Interval
                </label>
                <div className="relative">
                  <select
                    value={timeRange.interval}
                    onChange={(e) => handleTimeChange('interval', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="40">40 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
              
              {/* Volunteers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline-block mr-1 mb-0.5" size={16} />
                  Volunteers
                </label>
                <div className="space-y-2">
                  {volunteers.map((volunteer, index) => (
                    <input
                      key={index}
                      type="text"
                      value={volunteer}
                      onChange={(e) => handleVolunteerChange(index, e.target.value)}
                      placeholder={`Volunteer ${index + 1}`}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ))}
                </div>
                <button
                  onClick={addVolunteer}
                  className="mt-2 inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded hover:bg-indigo-200"
                >
                  <Plus size={16} className="mr-1" />
                  Add Volunteer
                </button>
              </div>
              
              {/* Generate Button */}
              <button
                onClick={generateSchedule}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : "Generate Schedule"}
              </button>
            </div>
          </div>
          
          {/* Schedule Panel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Calendar className="mr-2 text-indigo-600" size={20} />
                Schedule
              </h2>
              
              {schedule.length > 0 && (
                <button
                  onClick={enterScreenshotMode}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                >
                  <Camera size={16} className="mr-1" />
                  Mobile View
                </button>
              )}
            </div>
            
            {schedule.length > 0 ? (
              <>
                {conflicts.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm flex items-start">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Warning: Schedule has conflicts</p>
                      <p>The highlighted cells indicate volunteers working back-to-back shifts.</p>
                    </div>
                  </div>
                )}
                
                {/* Volunteer Summary */}
                {schedule.length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Volunteer Shifts</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(schedule[0].shiftCounts || {}).map(([volunteer, count], index) => (
                        <div 
                          key={index}
                          className="px-2 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: colors[volunteer]?.bg || 'transparent',
                            color: colors[volunteer]?.text || 'inherit',
                          }}
                        >
                          {volunteer}: {count}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Schedule Table */}
                <div className="overflow-auto max-h-96 border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volunteer 1
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volunteer 2
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schedule.map((slot, slotIndex) => (
                        <tr key={slotIndex} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {slot.display12}
                          </td>
                          {[0, 1].map(volIndex => {
                            const volunteer = slot.volunteers[volIndex];
                            const hasConflict = conflicts.some(c => 
                              c.slotIndex === slotIndex && c.volunteer === volunteer
                            );
                            const hasDuplicateError = duplicateError && 
                                                      duplicateError.slotIndex === slotIndex;
                            
                            return (
                              <td key={volIndex} className="px-3 py-2 whitespace-nowrap text-sm">
                                <div className={`rounded ${hasConflict ? 'bg-red-50' : ''} ${hasDuplicateError ? 'border border-red-300' : ''}`}>
                                  <select
                                    value={volunteer || ''}
                                    onChange={(e) => updateScheduleVolunteer(slotIndex, volIndex, e.target.value)}
                                    className="w-full py-1 px-2 rounded border-0 focus:ring-0"
                                    style={{
                                      backgroundColor: volunteer ? colors[volunteer]?.bg : 'transparent',
                                      color: volunteer ? colors[volunteer]?.text : 'inherit'
                                    }}
                                  >
                                    <option value="">Select volunteer</option>
                                    {volunteers.filter(v => v.trim() !== '').map((v, i) => (
                                      <option key={i} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {hasConflict && (
                                  <div className="text-xs text-red-600 mt-1">
                                    Back-to-back shift
                                  </div>
                                )}
                                
                                {hasDuplicateError && volIndex === 0 && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {duplicateError.message}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Calendar size={48} className="mb-4 opacity-30" />
                <p>No schedule generated yet</p>
                <p className="text-sm">Fill in the setup form and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="mt-8 py-4 border-t border-gray-200 text-center text-gray-500 text-xs">
        SMPW Volunteer Schedule Builder | Created for Special Metropolitan Public Witnessing Program
      </footer>
    </div>
  );
};

export default ScheduleBuilder;
