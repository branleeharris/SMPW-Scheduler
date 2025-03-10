import React, { useState, useRef, useEffect } from 'react';
import { Clock, Users, Calendar, ChevronDown, Plus, AlertTriangle, Camera, X, Smartphone, Download, Info, Shuffle, Building, Sun, Moon, Copy, Check, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { incrementScheduleCounter, getScheduleCount } from './firebase';

const ScheduleBuilder = () => {
  const [volunteers, setVolunteers] = useState(['', '', '', '', '']);
  const [locationName, setLocationName] = useState('');
  const [timeRange, setTimeRange] = useState({ 
    startTime: '16:00', 
    endTime: '20:00', 
    interval: 30,
    isCustomInterval: false,
    customInterval: 30,
    date: new Date().toISOString().split('T')[0]
  });
  const [schedule, setSchedule] = useState([]);
  const [colors, setColors] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [duplicateError, setDuplicateError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null); // 'copying', 'success', 'error'
  const [showCopyFallback, setShowCopyFallback] = useState(false);
  const [schedulesGenerated, setSchedulesGenerated] = useState(0);
  
  const scheduleRef = useRef(null);
  
  // Load global schedule count from Firebase
  useEffect(() => {
    try {
      getScheduleCount((count) => {
        setSchedulesGenerated(count);
      });
    } catch (error) {
      console.error("Error fetching schedule count:", error);
      // Fallback to localStorage if Firebase fails
      const localCount = localStorage.getItem('schedulesGenerated');
      if (localCount) {
        setSchedulesGenerated(parseInt(localCount));
      } else {
        setSchedulesGenerated(0);
      }
    }
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };
  
  // Apply dark mode to document body when it changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    // Regenerate colors when mode changes if schedule exists
    if (schedule.length > 0) {
      const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
      setColors(generateColors(filteredVolunteers));
    }
  }, [darkMode]);
  
  // Handle volunteer input change
  const handleVolunteerChange = (index, value) => {
    const newVolunteers = [...volunteers];
    newVolunteers[index] = value;
    setVolunteers(newVolunteers);
  };
  
  // Handle time range changes
  const handleTimeChange = (field, value) => {
    if (field === 'interval') {
      if (value === 'custom') {
        setTimeRange(prev => ({ 
          ...prev, 
          isCustomInterval: true 
        }));
      } else {
        setTimeRange(prev => ({ 
          ...prev, 
          interval: parseInt(value), 
          isCustomInterval: false 
        }));
      }
    } else if (field === 'customInterval') {
      setTimeRange(prev => ({ 
        ...prev, 
        customInterval: parseInt(value),
        interval: parseInt(value)
      }));
    } else {
      setTimeRange(prev => ({ ...prev, [field]: value }));
    }
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
  
  // Format date in a readable way - Fixed to prevent date shifting
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Split the date string into components and create date using local time
    // (this prevents timezone issues that cause the date to shift)
    const [year, month, day] = dateStr.split('-').map(Number);
    // Note: month is 0-indexed in JavaScript Date constructor
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Generate colors for volunteers
  const generateColors = (volunteers) => {
    const colorMap = {};
    
    // Different color palettes for light and dark mode
    const colorPalette = darkMode ? [
      { bg: '#1a365d', text: '#90cdf4' }, // Dark Blue
      { bg: '#5f370e', text: '#fbd38d' }, // Dark Orange
      { bg: '#1e4620', text: '#9ae6b4' }, // Dark Green
      { bg: '#521b41', text: '#fbb6ce' }, // Dark Pink
      { bg: '#44337a', text: '#d6bcfa' }, // Dark Purple
      { bg: '#154e4e', text: '#81e6d9' }, // Dark Teal
      { bg: '#652b19', text: '#fbd38d' }, // Dark Amber
      { bg: '#2d3748', text: '#e2e8f0' }, // Dark Gray
      { bg: '#22543d', text: '#9ae6b4' }, // Dark Emerald
      { bg: '#702459', text: '#fbb6ce' }  // Dark Rose
    ] : [
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
  
  // Fisher-Yates shuffle algorithm to randomize array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
  const createSchedule = (volunteers, slots, randomize = false) => {
    // Apply randomness for shuffling if requested
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
      let availableVolunteers = filteredVolunteers.filter(v => 
        isVolunteerAvailable(v, slotIndex, assignedVolunteers)
      );
      
      if (availableVolunteers.length < 2) {
        // Not enough available volunteers, will handle in second pass
        return;
      }
      
      // Introduce randomness when shuffling
      if (randomize) {
        // Semi-random approach - we still want some balance in shift counts
        availableVolunteers = shuffleArray(availableVolunteers);
        // But we'll still sort by shift count to maintain some fairness
        availableVolunteers.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
      } else {
        // Original sorting by shift count
        availableVolunteers.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
      }
      
      // Select first volunteer (least shifts)
      const firstVolunteer = availableVolunteers[0];
      
      // Find best partner for variety (ensuring it's not the same volunteer)
      let bestPartner = null;
      let lowestPairCount = Infinity;
      
      // When randomizing, occasionally pick a random partner instead of optimizing for variety
      if (randomize && Math.random() < 0.4) {
        const possiblePartners = availableVolunteers.filter(v => v !== firstVolunteer);
        if (possiblePartners.length > 0) {
          bestPartner = possiblePartners[Math.floor(Math.random() * possiblePartners.length)];
        }
      } else {
        // Regular partner selection based on pairings
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
        let sortedVolunteers = [...filteredVolunteers];
        
        // When randomizing, occasionally shuffle the volunteers first
        if (randomize) {
          sortedVolunteers = shuffleArray(sortedVolunteers);
        }
        
        // But still sort by shift count to maintain some fairness
        sortedVolunteers.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
        
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
  
  // Shuffle the schedule while maintaining rules
  const shuffleSchedule = () => {
    if (!schedule.length) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
      
      // Generate time slots
      const slots = generateTimeSlots(
        timeRange.startTime, 
        timeRange.endTime, 
        timeRange.isCustomInterval ? timeRange.customInterval : parseInt(timeRange.interval)
      );
      
      // Create shuffled schedule with randomization flag set to true
      const { assignments, shiftCounts } = createSchedule(filteredVolunteers, slots, true);
      
      // Create final schedule
      const newSchedule = slots.map((slot, index) => ({
        ...slot,
        volunteers: assignments[index],
        shiftCounts
      }));
      
      setSchedule(newSchedule);
      setConflicts([]);
      setIsLoading(false);
    }, 300);
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
      
      // Get interval value - either the selected preset or custom value
      const intervalValue = timeRange.isCustomInterval ? 
        timeRange.customInterval : 
        parseInt(timeRange.interval);
      
      // Generate time slots
      const slots = generateTimeSlots(
        timeRange.startTime, 
        timeRange.endTime, 
        intervalValue
      );
      
      // Create schedule with randomization flag set to false (default behavior)
      const { assignments, shiftCounts } = createSchedule(filteredVolunteers, slots, false);
      
      // Create final schedule
      const newSchedule = slots.map((slot, index) => ({
        ...slot,
        volunteers: assignments[index],
        shiftCounts
      }));
      
      setSchedule(newSchedule);
      setConflicts([]);
      setIsLoading(false);
      
      // Increment the counter in Firebase with error handling
      try {
        incrementScheduleCounter()
          .then(newCount => {
            if (newCount !== null) {
              setSchedulesGenerated(newCount);
            }
          })
          .catch(error => {
            console.error("Error incrementing counter:", error);
            // Fallback to local storage if Firebase fails
            const newLocalCount = schedulesGenerated + 1;
            setSchedulesGenerated(newLocalCount);
            localStorage.setItem('schedulesGenerated', newLocalCount.toString());
          });
      } catch (error) {
        console.error("Error with counter function:", error);
        // Fallback to local storage if Firebase fails
        const newLocalCount = schedulesGenerated + 1;
        setSchedulesGenerated(newLocalCount);
        localStorage.setItem('schedulesGenerated', newLocalCount.toString());
      }
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
      alert('Please resolve all scheduling conflicts before creating a schedule image.');
      return;
    }
    
    if (duplicateError) {
      alert('Please resolve the duplicate volunteer assignment before creating a schedule image.');
      return;
    }
    
    setScreenshotMode(true);
    setShowSaveInstructions(false);
    setShowCopyFallback(false);
    setShowIOSInstructions(false);
    setCopyStatus(null);
  };
  
  // Show save instructions modal
  const showSaveHelp = () => {
    setShowSaveInstructions(true);
    setShowCopyFallback(false);
    setShowIOSInstructions(false);
  };
  
  // iOS-compatible copy/share function
  // Share schedule image with messaging apps
  const copyScheduleToClipboard = async () => {
    if (!schedule.length) return;
    
    setCopyStatus('copying');
    
    try {
      // Create a canvas element with appropriate dimensions
      const canvas = document.createElement('canvas');
      
      // Configuration for the schedule rendering
      const config = {
        padding: 20,
        headerHeight: 60,
        rowHeight: 30,
        timeColumnWidth: 120,
        volunteerColumnWidth: 300,
        legendHeight: 40,
        cornerRadius: 2,
        borderColor: darkMode ? '#4a5568' : '#e2e8f0',
        headerBgColor: darkMode ? '#2d3748' : '#f7fafc',
        alternateRowColor: darkMode ? '#2d3748' : '#f7fafc',
        mainRowColor: darkMode ? '#1a202c' : '#ffffff',
        textColor: darkMode ? '#e2e8f0' : '#1a202c',
        mutedTextColor: darkMode ? '#a0aec0' : '#4a5568',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        pixelRatio: 2 // For higher resolution
      };
      
      // Calculate canvas dimensions
      const width = config.timeColumnWidth + config.volunteerColumnWidth + config.padding * 2;
      const height = config.headerHeight + ((schedule.length + 1) * config.rowHeight) + config.legendHeight + config.padding * 2;
      
      // Set canvas size with pixel ratio for high resolution
      canvas.width = width * config.pixelRatio;
      canvas.height = height * config.pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(config.pixelRatio, config.pixelRatio);
      
      // Apply anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill background
      ctx.fillStyle = darkMode ? '#1a202c' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw header
      ctx.fillStyle = darkMode ? '#ffffff' : '#1a202c';
      ctx.font = `bold 16px ${config.fontFamily}`;
      ctx.textAlign = 'center';
      const displayTitle = locationName ? `${locationName} Schedule` : 'Schedule';
      ctx.fillText(displayTitle, width / 2, config.padding + 20);
      
      // Draw date/time
      ctx.font = `12px ${config.fontFamily}`;
      ctx.fillStyle = config.mutedTextColor;
      const dateStr = formatDate(timeRange.date);
      const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
      ctx.fillText(`${dateStr} • ${timeStr}`, width / 2, config.padding + 40);
      
      // Table dimensions and position
      const tableTop = config.padding + config.headerHeight;
      const tableWidth = width - config.padding * 2;
      const tableHeight = (schedule.length + 1) * config.rowHeight; // +1 for header
      
      // Draw main table background
      ctx.fillStyle = darkMode ? '#1a202c' : '#ffffff';
      ctx.fillRect(config.padding, tableTop, tableWidth, tableHeight);
      
      // Draw header row background
      ctx.fillStyle = config.headerBgColor;
      ctx.fillRect(config.padding, tableTop, tableWidth, config.rowHeight);
      
      // Draw row backgrounds (alternating)
      for (let i = 0; i < schedule.length; i++) {
        if (i % 2 === 1) {
          ctx.fillStyle = config.alternateRowColor;
          // Don't cover the borders - make the background slightly smaller
          ctx.fillRect(
            config.padding + 1, 
            tableTop + config.rowHeight + (i * config.rowHeight) + 1, 
            tableWidth - 2, 
            config.rowHeight - 1
          );
        }
      }
      
      // Draw grid lines AFTER backgrounds so they're always visible
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = 1;
      
      // Outer border
      ctx.strokeRect(config.padding, tableTop, tableWidth, tableHeight);
      
      // Vertical divider for columns - draw AFTER the row backgrounds
      ctx.beginPath();
      ctx.moveTo(config.padding + config.timeColumnWidth, tableTop);
      ctx.lineTo(config.padding + config.timeColumnWidth, tableTop + tableHeight);
      ctx.stroke();
      
      // Horizontal grid lines - draw AFTER the row backgrounds
      for (let i = 1; i <= schedule.length + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(config.padding, tableTop + i * config.rowHeight);
        ctx.lineTo(width - config.padding, tableTop + i * config.rowHeight);
        ctx.stroke();
      }
      
      // Draw header text
      ctx.fillStyle = config.textColor;
      ctx.font = `500 12px ${config.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('Time', config.padding + 10, tableTop + config.rowHeight / 2 + 5);
      
      ctx.textAlign = 'center';
      ctx.fillText('Volunteers', config.padding + config.timeColumnWidth + config.volunteerColumnWidth / 2, 
                  tableTop + config.rowHeight / 2 + 5);
      
      // Draw schedule rows (data rows)
      schedule.forEach((slot, index) => {
        // Calculate row position (offset by header row)
        const y = tableTop + config.rowHeight + (index * config.rowHeight);
        
        // Time text
        ctx.fillStyle = config.textColor;
        ctx.font = `500 12px ${config.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(slot.compactDisplay, config.padding + 10, y + config.rowHeight / 2 + 5);
        
        // Draw volunteer boxes
        const volunteerWidth = config.volunteerColumnWidth / 2 - 8;
        slot.volunteers.forEach((volunteer, vIndex) => {
          if (!volunteer) return;
          
          const vx = config.padding + config.timeColumnWidth + 4 + vIndex * (volunteerWidth + 8);
          const vy = y + 5;
          const vHeight = config.rowHeight - 10;
          
          // Volunteer background - draw a rounded rectangle
          const radius = config.cornerRadius;
          ctx.fillStyle = colors[volunteer]?.bg || config.alternateRowColor;
          
          // Draw rounded rectangle
          ctx.beginPath();
          ctx.moveTo(vx + radius, vy);
          ctx.lineTo(vx + volunteerWidth - radius, vy);
          ctx.quadraticCurveTo(vx + volunteerWidth, vy, vx + volunteerWidth, vy + radius);
          ctx.lineTo(vx + volunteerWidth, vy + vHeight - radius);
          ctx.quadraticCurveTo(vx + volunteerWidth, vy + vHeight, vx + volunteerWidth - radius, vy + vHeight);
          ctx.lineTo(vx + radius, vy + vHeight);
          ctx.quadraticCurveTo(vx, vy + vHeight, vx, vy + vHeight - radius);
          ctx.lineTo(vx, vy + radius);
          ctx.quadraticCurveTo(vx, vy, vx + radius, vy);
          ctx.closePath();
          ctx.fill();
          
          // Volunteer text
          ctx.fillStyle = colors[volunteer]?.text || config.textColor;
          ctx.font = `11px ${config.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(volunteer, vx + volunteerWidth / 2, vy + vHeight / 2);
          ctx.textBaseline = 'alphabetic';
        });
      });
      
      // Draw legend
      const legendY = tableTop + tableHeight + 10;
      const shiftCounts = schedule[0]?.shiftCounts || {};
      const volunteers = Object.keys(shiftCounts);
      
      let legendX = config.padding;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `11px ${config.fontFamily}`;
      
      volunteers.forEach(volunteer => {
        const count = shiftCounts[volunteer];
        const legendText = `${volunteer}:${count}`;
        const textWidth = ctx.measureText(legendText).width;
        const legendWidth = textWidth + 16;
        const legendHeight = 18;
        const radius = config.cornerRadius;
        
        // Background - draw a rounded rectangle
        ctx.fillStyle = colors[volunteer]?.bg || config.alternateRowColor;
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(legendX + radius, legendY);
        ctx.lineTo(legendX + legendWidth - radius, legendY);
        ctx.quadraticCurveTo(legendX + legendWidth, legendY, legendX + legendWidth, legendY + radius);
        ctx.lineTo(legendX + legendWidth, legendY + legendHeight - radius);
        ctx.quadraticCurveTo(legendX + legendWidth, legendY + legendHeight, legendX + legendWidth - radius, legendY + legendHeight);
        ctx.lineTo(legendX + radius, legendY + legendHeight);
        ctx.quadraticCurveTo(legendX, legendY + legendHeight, legendX, legendY + legendHeight - radius);
        ctx.lineTo(legendX, legendY + radius);
        ctx.quadraticCurveTo(legendX, legendY, legendX + radius, legendY);
        ctx.closePath();
        ctx.fill();
        
        // Text
        ctx.fillStyle = colors[volunteer]?.text || config.textColor;
        ctx.fillText(legendText, legendX + legendWidth / 2, legendY + legendHeight / 2);
        
        legendX += legendWidth + 6;
      });
      
      // Convert canvas to blob for sharing
      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const imageUrl = canvas.toDataURL('image/png');
      
      // Create file name
      const dateString = timeRange.date.replace(/-/g, '');
      const locationText = locationName ? `${locationName.replace(/\s+/g, '_')}` : 'Volunteer';
      const filename = `${locationText}_Schedule_${dateString}.png`;
      
      // Detect iOS - this is a simple check but covers most cases
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      // Try to use modern Web Share API first (works on most mobile devices)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([imageBlob], filename, { type: 'image/png' });
          const shareData = { 
            files: [file],
            title: 'Volunteer Schedule'
          };
          
          // Check if we can share files
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setCopyStatus('success');
            setTimeout(() => setCopyStatus(null), 2000);
            return;
          }
        } catch (shareError) {
          console.log('Share API file sharing error:', shareError);
          // Fall through to alternatives
        }
      }
      
      // iOS-specific behavior if Web Share API failed
      if (isIOS) {
        // Try to trigger a download which can then be shared
        try {
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setCopyStatus('success');
          setTimeout(() => setCopyStatus(null), 2000);
          
          // Show iOS instructions after a small delay
          setTimeout(() => {
            setShowIOSInstructions(true);
          }, 300);
          return;
        } catch (linkError) {
          console.log('Link download error:', linkError);
        }
        
        // If all automated methods fail, show iOS-specific instructions
        setCopyStatus('error');
        setShowIOSInstructions(true);
        return;
      }
      
      // Non-iOS path - try Clipboard API
      if (navigator.clipboard && navigator.clipboard.write) {
        try {
          const item = new ClipboardItem({ 'image/png': imageBlob });
          await navigator.clipboard.write([item]);
          setCopyStatus('success');
          setTimeout(() => setCopyStatus(null), 2000);
          return;
        } catch (clipError) {
          console.log('Clipboard API error:', clipError);
          // Fall through to alternatives
        }
      }
      
      // Last resort - try generic download
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus(null), 2000);
      } catch (downloadError) {
        console.log('Download error:', downloadError);
        // Show fallback instructions
        setCopyStatus('error');
        setShowCopyFallback(true);
      }
      
    } catch (err) {
      console.error('Error creating image:', err);
      setCopyStatus('error');
      setShowCopyFallback(true);
    }
  };
  
  // Download schedule as image - CANVAS BASED APPROACH
  const downloadScheduleImage = () => {
    if (!schedule.length) return;
    
    // Show loading indicator
    const downloadBtn = document.querySelector('.download-btn');
    let originalContent = '';
    if (downloadBtn) {
      originalContent = downloadBtn.innerHTML;
      downloadBtn.innerHTML = '<span>Downloading...</span>';
    }
    
    try {
      // Create a canvas element with appropriate dimensions
      const canvas = document.createElement('canvas');
      
      // Configuration for the schedule rendering
      const config = {
        padding: 20,
        headerHeight: 60,
        rowHeight: 30,
        timeColumnWidth: 120,
        volunteerColumnWidth: 300,
        legendHeight: 40,
        cornerRadius: 2,
        borderColor: darkMode ? '#4a5568' : '#e2e8f0',
        headerBgColor: darkMode ? '#2d3748' : '#f7fafc',
        alternateRowColor: darkMode ? '#2d3748' : '#f7fafc',
        mainRowColor: darkMode ? '#1a202c' : '#ffffff',
        textColor: darkMode ? '#e2e8f0' : '#1a202c',
        mutedTextColor: darkMode ? '#a0aec0' : '#4a5568',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        pixelRatio: 2 // For higher resolution
      };
      
      // Calculate canvas dimensions
      const width = config.timeColumnWidth + config.volunteerColumnWidth + config.padding * 2;
      const height = config.headerHeight + ((schedule.length + 1) * config.rowHeight) + config.legendHeight + config.padding * 2;
      
      // Set canvas size with pixel ratio for high resolution
      canvas.width = width * config.pixelRatio;
      canvas.height = height * config.pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(config.pixelRatio, config.pixelRatio);
      
      // Apply anti-aliasing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill background
      ctx.fillStyle = darkMode ? '#1a202c' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Draw header
      ctx.fillStyle = darkMode ? '#ffffff' : '#1a202c';
      ctx.font = `bold 16px ${config.fontFamily}`;
      ctx.textAlign = 'center';
      const displayTitle = locationName ? `${locationName} Schedule` : 'Schedule';
      ctx.fillText(displayTitle, width / 2, config.padding + 20);
      
      // Draw date/time
      ctx.font = `12px ${config.fontFamily}`;
      ctx.fillStyle = config.mutedTextColor;
      const dateStr = formatDate(timeRange.date);
      const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
      ctx.fillText(`${dateStr} • ${timeStr}`, width / 2, config.padding + 40);
      
      // Table dimensions and position
      const tableTop = config.padding + config.headerHeight;
      const tableWidth = width - config.padding * 2;
      const tableHeight = (schedule.length + 1) * config.rowHeight; // +1 for header
      
      // Draw main table background
      ctx.fillStyle = darkMode ? '#1a202c' : '#ffffff';
      ctx.fillRect(config.padding, tableTop, tableWidth, tableHeight);
      
      // Draw header row background
      ctx.fillStyle = config.headerBgColor;
      ctx.fillRect(config.padding, tableTop, tableWidth, config.rowHeight);
      
      // Draw row backgrounds (alternating)
      for (let i = 0; i < schedule.length; i++) {
        if (i % 2 === 1) {
          ctx.fillStyle = config.alternateRowColor;
          // Don't cover the borders - make the background slightly smaller
          ctx.fillRect(
            config.padding + 1, 
            tableTop + config.rowHeight + (i * config.rowHeight) + 1, 
            tableWidth - 2, 
            config.rowHeight - 1
          );
        }
      }
      
      // Draw grid lines AFTER backgrounds so they're always visible
      ctx.strokeStyle = config.borderColor;
      ctx.lineWidth = 1;
      
      // Outer border
      ctx.strokeRect(config.padding, tableTop, tableWidth, tableHeight);
      
      // Vertical divider for columns - draw AFTER the row backgrounds
      ctx.beginPath();
      ctx.moveTo(config.padding + config.timeColumnWidth, tableTop);
      ctx.lineTo(config.padding + config.timeColumnWidth, tableTop + tableHeight);
      ctx.stroke();
      
      // Horizontal grid lines - draw AFTER the row backgrounds
      for (let i = 1; i <= schedule.length + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(config.padding, tableTop + i * config.rowHeight);
        ctx.lineTo(width - config.padding, tableTop + i * config.rowHeight);
        ctx.stroke();
      }
      
      // Draw header text
      ctx.fillStyle = config.textColor;
      ctx.font = `500 12px ${config.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('Time', config.padding + 10, tableTop + config.rowHeight / 2 + 5);
      
      ctx.textAlign = 'center';
      ctx.fillText('Volunteers', config.padding + config.timeColumnWidth + config.volunteerColumnWidth / 2, 
                  tableTop + config.rowHeight / 2 + 5);
      
      // Draw schedule rows (data rows)
      schedule.forEach((slot, index) => {
        // Calculate row position (offset by header row)
        const y = tableTop + config.rowHeight + (index * config.rowHeight);
        
        // Time text
        ctx.fillStyle = config.textColor;
        ctx.font = `500 12px ${config.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText(slot.compactDisplay, config.padding + 10, y + config.rowHeight / 2 + 5);
        
        // Draw volunteer boxes
        const volunteerWidth = config.volunteerColumnWidth / 2 - 8;
        slot.volunteers.forEach((volunteer, vIndex) => {
          if (!volunteer) return;
          
          const vx = config.padding + config.timeColumnWidth + 4 + vIndex * (volunteerWidth + 8);
          const vy = y + 5;
          const vHeight = config.rowHeight - 10;
          
          // Volunteer background - draw a rounded rectangle
          const radius = config.cornerRadius;
          ctx.fillStyle = colors[volunteer]?.bg || config.alternateRowColor;
          
          // Draw rounded rectangle
          ctx.beginPath();
          ctx.moveTo(vx + radius, vy);
          ctx.lineTo(vx + volunteerWidth - radius, vy);
          ctx.quadraticCurveTo(vx + volunteerWidth, vy, vx + volunteerWidth, vy + radius);
          ctx.lineTo(vx + volunteerWidth, vy + vHeight - radius);
          ctx.quadraticCurveTo(vx + volunteerWidth, vy + vHeight, vx + volunteerWidth - radius, vy + vHeight);
          ctx.lineTo(vx + radius, vy + vHeight);
          ctx.quadraticCurveTo(vx, vy + vHeight, vx, vy + vHeight - radius);
          ctx.lineTo(vx, vy + radius);
          ctx.quadraticCurveTo(vx, vy, vx + radius, vy);
          ctx.closePath();
          ctx.fill();
          
          // Volunteer text
          ctx.fillStyle = colors[volunteer]?.text || config.textColor;
          ctx.font = `11px ${config.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(volunteer, vx + volunteerWidth / 2, vy + vHeight / 2);
          ctx.textBaseline = 'alphabetic';
        });
      });
      
      // Draw legend
      const legendY = tableTop + tableHeight + 10;
      const shiftCounts = schedule[0]?.shiftCounts || {};
      const volunteers = Object.keys(shiftCounts);
      
      let legendX = config.padding;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `11px ${config.fontFamily}`;
      
      volunteers.forEach(volunteer => {
        const count = shiftCounts[volunteer];
        const legendText = `${volunteer}:${count}`;
        const textWidth = ctx.measureText(legendText).width;
        const legendWidth = textWidth + 16;
        const legendHeight = 18;
        const radius = config.cornerRadius;
        
        // Background - draw a rounded rectangle
        ctx.fillStyle = colors[volunteer]?.bg || config.alternateRowColor;
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(legendX + radius, legendY);
        ctx.lineTo(legendX + legendWidth - radius, legendY);
        ctx.quadraticCurveTo(legendX + legendWidth, legendY, legendX + legendWidth, legendY + radius);
        ctx.lineTo(legendX + legendWidth, legendY + legendHeight - radius);
        ctx.quadraticCurveTo(legendX + legendWidth, legendY + legendHeight, legendX + legendWidth - radius, legendY + legendHeight);
        ctx.lineTo(legendX + radius, legendY + legendHeight);
        ctx.quadraticCurveTo(legendX, legendY + legendHeight, legendX, legendY + legendHeight - radius);
        ctx.lineTo(legendX, legendY + radius);
        ctx.quadraticCurveTo(legendX, legendY, legendX + radius, legendY);
        ctx.closePath();
        ctx.fill();
        
        // Text
        ctx.fillStyle = colors[volunteer]?.text || config.textColor;
        ctx.fillText(legendText, legendX + legendWidth / 2, legendY + legendHeight / 2);
        
        legendX += legendWidth + 6;
      });
      
      // Convert to image and download
      const image = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const dateString = timeRange.date.replace(/-/g, '');
      const locationText = locationName ? `${locationName.replace(/\s+/g, '_')}` : 'Volunteer';
      const filename = `${locationText}_Schedule_${dateString}.png`;
      
      downloadLink.download = filename;
      downloadLink.href = image;
      downloadLink.click();
      
      // Reset button state
      if (downloadBtn) {
        downloadBtn.innerHTML = originalContent;
      }
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Could not create image. Please try again.');
      if (downloadBtn) {
        downloadBtn.innerHTML = originalContent;
      }
    }
  };
  
  // The compact screenshot view component optimized for mobile
  const ScreenshotView = () => {
    if (!schedule.length) return null;
    
    const dateStr = formatDate(timeRange.date);
    const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
    const shiftCounts = schedule[0]?.shiftCounts || {};
    const displayTitle = locationName ? `${locationName} Schedule` : `Schedule`;
    
    return (
      <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-auto`}>
        <div className="relative max-w-md mx-auto">
          {/* Controls - with better spacing for mobile */}
          <div className="absolute top-2 right-2 flex space-x-2">
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={downloadScheduleImage}
              className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'} download-btn`}
              aria-label="Download schedule"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={showSaveHelp}
              className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Help with saving"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => setScreenshotMode(false)}
              className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Close screenshot mode"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Increased top padding to prevent controls overlap */}
          <div className="pt-12 pb-2 px-3" ref={scheduleRef}>
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{displayTitle}</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{dateStr} • {timeStr}</p>
            </div>
            
            {/* Compact Schedule Table - Using pure HTML table for better rendering */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              borderSpacing: 0,
              fontSize: '12px',
              marginBottom: '8px',
              border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0'
            }}>
              <thead>
                <tr style={{ 
                  background: darkMode ? '#2d3748' : '#f7fafc'
                }}>
                  <th style={{ 
                    border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '4px 4px',
                    textAlign: 'left',
                    fontWeight: '500',
                    color: darkMode ? '#e2e8f0' : '#1a202c'
                  }}>
                    Time
                  </th>
                  <th style={{ 
                    border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '4px 4px',
                    textAlign: 'center',
                    fontWeight: '500',
                    color: darkMode ? '#e2e8f0' : '#1a202c'
                  }}>
                    Volunteers
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((slot, index) => (
                  <tr key={index} style={{ 
                    background: index % 2 === 0 
                      ? (darkMode ? '#1a202c' : '#ffffff') 
                      : (darkMode ? '#2d3748' : '#f7fafc')
                  }}>
                    <td style={{ 
                      border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      padding: '4px 4px',
                      whiteSpace: 'nowrap',
                      fontWeight: '500',
                      color: darkMode ? '#e2e8f0' : '#1a202c'
                    }}>
                      {slot.compactDisplay}
                    </td>
                    <td style={{ 
                      border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      padding: '4px 2px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        {slot.volunteers.map((volunteer, vIndex) => (
                          <div 
                            key={vIndex}
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '45%',
                              height: '22px',
                              backgroundColor: colors[volunteer]?.bg || 'transparent',
                              color: colors[volunteer]?.text || 'inherit',
                              borderRadius: '2px',
                              fontSize: '11px',
                              margin: '0 2px'
                            }}
                          >
                            {volunteer}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Legend using flex for vertical alignment */}
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {Object.keys(shiftCounts).map((volunteer, index) => (
                  <div 
                    key={index}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '18px',
                      backgroundColor: colors[volunteer]?.bg || 'transparent',
                      color: colors[volunteer]?.text || 'inherit',
                      borderRadius: '2px',
                      fontSize: '11px',
                      padding: '0 4px',
                      margin: '0 2px'
                    }}
                  >
                    {volunteer}:{shiftCounts[volunteer]}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Share button with status indication */}
          <div className="flex justify-center mt-4 mb-2">
            <button
              onClick={copyScheduleToClipboard}
              disabled={copyStatus === 'copying'}
              className={`flex items-center justify-center py-2 px-5 rounded-lg font-medium copy-btn ${
                copyStatus === 'success' 
                  ? (darkMode ? 'bg-green-800 text-green-200' : 'bg-green-600 text-white')
                  : copyStatus === 'error'
                  ? (darkMode ? 'bg-red-800 text-red-200' : 'bg-red-600 text-white')
                  : (darkMode ? 'bg-indigo-800 text-white' : 'bg-indigo-600 text-white')
              } transition-colors`}
            >
              {copyStatus === 'copying' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : copyStatus === 'success' ? (
                <>
                  <Check className="mr-2" size={20} />
                  Success!
                </>
              ) : copyStatus === 'error' ? (
                <>
                  <AlertCircle className="mr-2" size={20} />
                  Try Another Method
                </>
              ) : (
                <>
                  <Copy className="mr-2" size={20} />
                  Share Schedule
                </>
              )}
            </button>
          </div>
          
          <div className="text-center mb-4">
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Share this schedule via message or save to your device
            </p>
          </div>
        </div>
        
        {/* Save Instructions Modal */}
        {showSaveInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 rounded-lg shadow-lg max-w-sm mx-auto w-full`}>
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Smartphone className="mr-2" size={20} />
                Instructions
              </h3>
              <div className="mb-4">
                <p className="mb-2 text-sm">How to share:</p>
                <ol className={`list-decimal pl-5 text-sm space-y-1 ${darkMode ? 'text-gray-300' : ''}`}>
                  <li>Select "Share Schedule" to share directly using your phone's text messaging app.</li>
                  <li>If you're not ready to share this, click the download icon at the top to save a picture of the schedule to your phone.</li>
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
        
        {/* Copy Fallback Instructions */}
        {showCopyFallback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 rounded-lg shadow-lg max-w-sm mx-auto w-full`}>
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Copy className="mr-2" size={20} />
                Copy Schedule
              </h3>
              <div className="mb-4">
                <p className="mb-2 text-sm">Your device doesn't support direct clipboard copying of images. You can:</p>
                <ol className={`list-decimal pl-5 text-sm space-y-1 ${darkMode ? 'text-gray-300' : ''}`}>
                  <li>Take a screenshot of this screen</li>
                  <li>Download the image using the download button</li>
                  <li>Use the screenshot to share via messages</li>
                </ol>
              </div>
              <button 
                onClick={() => setShowCopyFallback(false)}
                className="w-full py-2 bg-indigo-600 text-white rounded-md"
              >
                Got it
              </button>
            </div>
          </div>
        )}
        
        {/* iOS-specific Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 rounded-lg shadow-lg max-w-sm mx-auto w-full`}>
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <Smartphone className="mr-2" size={20} />
                iPhone Instructions
              </h3>
              <div className="mb-4">
                <p className="mb-2 text-sm">To share this schedule from your iPhone:</p>
                <ol className={`list-decimal pl-5 text-sm space-y-2 ${darkMode ? 'text-gray-300' : ''}`}>
                  <li>Take a screenshot by pressing the side button and volume up button at the same time</li>
                  <li>Tap the screenshot preview in the bottom-left corner</li>
                  <li>Use the crop tool to adjust if needed</li>
                  <li>Tap the share icon (square with arrow) and select your messaging app</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowIOSInstructions(false);
                    downloadScheduleImage();
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
                >
                  <Download size={16} className="mr-1" /> Download
                </button>
                <button 
                  onClick={() => setShowIOSInstructions(false)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-md"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      {/* Header with mobile improvements */}
      <header className={`bg-gradient-to-r ${darkMode ? 'from-indigo-900 to-purple-900' : 'from-indigo-600 to-purple-600'} py-4 px-4 text-white`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-0 flex items-center">
              <Calendar className="mr-2 hidden sm:inline" />
              <span>Volunteer Schedule Builder</span>
            </h1>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white flex items-center"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span className="ml-1 text-sm hidden sm:inline">{darkMode ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {screenshotMode && <ScreenshotView />}
      
      {/* Main content with mobile improvements */}
      <main className="py-4 px-3 sm:py-6 sm:px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Setup Panel - Improved for mobile */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center`}>
              <Users className={`mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={20} />
              Setup
            </h2>
            
            <div className="space-y-5">
              {/* Location Name */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <Building className="inline-block mr-1 mb-0.5" size={16} />
                  Location Name (Optional)
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Enter location name"
                  className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'} rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                />
              </div>
              
              {/* Date */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <Calendar className="inline-block mr-1 mb-0.5" size={16} />
                  Shift Date
                </label>
                <input
                  type="date"
                  value={timeRange.date}
                  onChange={(e) => handleTimeChange('date', e.target.value)}
                  className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                />
              </div>
              
              {/* Time Range - Improved for mobile */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <Clock className="inline-block mr-1 mb-0.5" size={16} />
                  Shift Time
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="w-full">
                    <input
                      type="time"
                      value={timeRange.startTime}
                      onChange={(e) => handleTimeChange('startTime', e.target.value)}
                      className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                    />
                  </div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center sm:mx-2`}>to</span>
                  <div className="w-full">
                    <input
                      type="time"
                      value={timeRange.endTime}
                      onChange={(e) => handleTimeChange('endTime', e.target.value)}
                      className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Shift Interval */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  <Clock className="inline-block mr-1 mb-0.5" size={16} />
                  How long should each shift be?
                </label>
                <div className="relative">
                  <select
                    value={timeRange.isCustomInterval ? 'custom' : timeRange.interval}
                    onChange={(e) => handleTimeChange('interval', e.target.value)}
                    className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                  >
                    <option value="20">20 minutes</option>
                    <option value="25">25 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="custom">Custom</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                </div>
                
                {/* Custom interval input */}
                {timeRange.isCustomInterval && (
                  <div className="mt-2">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Custom shift length (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={timeRange.customInterval}
                      onChange={(e) => handleTimeChange('customInterval', e.target.value)}
                      className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                    />
                  </div>
                )}
              </div>
              
              {/* Volunteers - Improved spacing for mobile */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
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
                      className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'} rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                    />
                  ))}
                </div>
                <button
                  onClick={addVolunteer}
                  className={`mt-3 inline-flex items-center px-3 py-2 text-sm font-medium ${
                    darkMode 
                      ? 'text-indigo-300 bg-indigo-900 hover:bg-indigo-800' 
                      : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
                  } rounded`}
                >
                  <Plus size={16} className="mr-1" />
                  Add Volunteer
                </button>
              </div>
              
              {/* Generate Button - Increased touch target for mobile */}
              <button
                onClick={generateSchedule}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center text-base"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : "Generate Schedule"}
              </button>
            </div>
          </div>
          
          {/* Schedule Panel - Improved for mobile */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 rounded-lg shadow`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                <Calendar className={`mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={20} />
                Schedule
              </h2>
              
              {schedule.length > 0 && (
                <button
                  onClick={shuffleSchedule}
                  disabled={isLoading}
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium ${
                    darkMode 
                      ? 'text-purple-300 bg-purple-900 hover:bg-purple-800' 
                      : 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                  } rounded mr-2`}
                >
                  <Shuffle size={16} className="mr-1" />
                  Shuffle
                </button>
              )}
            </div>
            
            {schedule.length > 0 ? (
              <>
                {conflicts.length > 0 && (
                  <div className={`mb-4 p-3 ${darkMode ? 'bg-yellow-900 border-yellow-800 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border rounded-md text-sm flex items-start`}>
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Warning: Schedule has conflicts</p>
                      <p>The highlighted cells indicate volunteers working back-to-back shifts.</p>
                    </div>
                  </div>
                )}
                
                {/* Volunteer Summary */}
                {schedule.length > 0 && (
                  <div className={`mb-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Volunteer Shifts</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(schedule[0].shiftCounts || {}).map(([volunteer, count], index) => (
                        <div 
                          key={index}
                          className="px-2 py-1 rounded text-sm inline-flex items-center justify-center"
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
                
                {/* Schedule Table - Improved for mobile */}
                <div className={`overflow-x-auto overflow-y-auto max-h-80 sm:max-h-96 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-md`}>
                  <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                      <tr>
                        <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          Time
                        </th>
                        <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          Vol 1
                        </th>
                        <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                          Vol 2
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {schedule.map((slot, slotIndex) => (
                        <tr key={slotIndex} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                          <td className={`px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
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
                              <td key={volIndex} className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                                <div className={`rounded ${hasConflict ? (darkMode ? 'bg-red-900' : 'bg-red-50') : ''} ${hasDuplicateError ? (darkMode ? 'border border-red-700' : 'border border-red-300') : ''}`}>
                                  <select
                                    value={volunteer || ''}
                                    onChange={(e) => updateScheduleVolunteer(slotIndex, volIndex, e.target.value)}
                                    className={`w-full py-1 px-2 rounded border-0 focus:ring-0 text-xs sm:text-sm ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                                    style={{
                                      backgroundColor: volunteer ? colors[volunteer]?.bg : (darkMode ? '#1F2937' : 'transparent'),
                                      color: volunteer ? colors[volunteer]?.text : 'inherit'
                                    }}
                                  >
                                    <option value="" className={darkMode ? 'bg-gray-700' : ''}>Select volunteer</option>
                                    {volunteers.filter(v => v.trim() !== '').map((v, i) => (
                                      <option key={i} value={v} className={darkMode ? 'bg-gray-700' : ''}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {hasConflict && (
                                  <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mt-1`}>
                                    Back-to-back shift
                                  </div>
                                )}
                                
                                {hasDuplicateError && volIndex === 0 && (
                                  <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mt-1`}>
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
                
                {/* Finished Button - Larger for better mobile touch target */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={enterScreenshotMode}
                    className="inline-flex items-center px-5 py-2 text-base font-medium text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    <Camera size={18} className="mr-2" />
                    Finished
                  </button>
                </div>
              </>
            ) : (
              <div className={`flex flex-col items-center justify-center h-52 md:h-64 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar size={48} className="mb-4 opacity-30" />
                <p>No schedule generated yet</p>
                <p className="text-sm">Fill in the setup form and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className={`mt-6 py-4 border-t ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-center text-xs">
          <div>v.1.1</div>
          <div className={`mt-1 sm:mt-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {schedulesGenerated.toLocaleString()} schedules made with this tool
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ScheduleBuilder;