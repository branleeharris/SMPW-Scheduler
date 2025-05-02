import React, { useState, useRef, useEffect } from 'react';
import { Clock, Users, Calendar, ChevronDown, Plus, AlertTriangle, Camera, X, Smartphone, Download, Info, Shuffle, Building, Sun, Moon, Copy, Check, AlertCircle, Volume2, VolumeX, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import html2canvas from 'html2canvas';
import { incrementScheduleCounter, getScheduleCount } from './firebase';

// Import 8-bit CSS
import './8bit.css';

const ScheduleBuilder = () => {
  const [volunteers, setVolunteers] = useState(['', '', '', '', '', '']);
  const [volunteerMap, setVolunteerMap] = useState({});  // Added volunteerMap
  const [locationName, setLocationName] = useState('');
  const [timeRange, setTimeRange] = useState({ 
    startTime: '08:00', 
    endTime: '12:00', 
    interval: 30,
    isCustomInterval: false,
    customInterval: 30,
    date: new Date().toISOString().split('T')[0]
  });
  const [dateEnabled, setDateEnabled] = useState(false); // New state for optional date
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
  //Gif click states
  const [clickCount, setClickCount] = useState(0);
  const [pokeSequenceCount, setPokeSequenceCount] = useState(0);
  const [showPokeAnimation, setShowPokeAnimation] = useState(false);
  const [showLowHpAnimation, setShowLowHpAnimation] = useState(false);
  const [showFellAnimation, setShowFellAnimation] = useState(false);
  
  // Updated function with corrected logic
  const handleWaveClick = (event) => {
    // If already showing the final "fell" animation, do nothing
    if (showFellAnimation) return;
    
    // Get the click position and image dimensions
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    
    // Only count if clicked on the LEFT half of the image
    if (x < width / 2) {
      // Increment the click counter
      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);
      
      // If we've reached 3 clicks
      if (newClickCount >= 3) {
        // Reset click counter
        setClickCount(0);
        
        // Determine which animation to show based on sequence count
        if (showLowHpAnimation) {
          // If we're at low HP and get triggered again, switch to fell animation permanently
          setShowLowHpAnimation(false);
          setShowFellAnimation(true);
          // No timeout - fell.gif remains until page reload
        } 
        else if (pokeSequenceCount >= 2) {
          // After 2 poking sequences, trigger the low HP animation on the 3rd
          setShowLowHpAnimation(true);
          
          // Increment sequence count (this will be 3 now)
          setPokeSequenceCount(pokeSequenceCount + 1);
          
          // Reset to normal after 5 seconds
          setTimeout(() => {
            setShowLowHpAnimation(false);
          }, 2000);
        } 
        else {
          // Regular poke animation for the first 2 sequences
          setShowPokeAnimation(true);
          
          // Increment the sequence counter
          setPokeSequenceCount(pokeSequenceCount + 1);
          
          // Reset after 5 seconds
          setTimeout(() => {
            setShowPokeAnimation(false);
          }, 2000);
        }
      }
    }
  };
  // New states for multiple locations
  const [multipleLocations, setMultipleLocations] = useState(false);
  const [locationNames, setLocationNames] = useState(['Location 1', 'Location 2']);
  
  // SMPW Easter Egg states
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [lastTitleClickTime, setLastTitleClickTime] = useState(0);
  const [smpwMode, setSmpwMode] = useState(false);
  const [scripturalPoint, setScripturalPoint] = useState("");
  const [showActivation, setShowActivation] = useState(false);
  
  // New audio Easter egg states
  const [audioMode, setAudioMode] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const audioRef = useRef(null);
  const [activationMessage, setActivationMessage] = useState("");
  
  // SMPW predefined locations
  const smpwLocations = [
    "Eastern Market",
    "Rosa Parks",
    "Campus Martius",
    "Greektown",
    "Grand Circus Park",
    "Hart Plaza",
    "Avalon Bakery",
    "Corktown",
    "Wayne State",
    "Airport - Evans Terminal",
    "Airport - McNamara Terminal"
  ];
  
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

  // Apply 8-bit mode when audio is activated
  useEffect(() => {
    if (audioMode) {
      // Load the 8-bit font
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
      document.head.appendChild(fontLink);
      
      // Add 8-bit class to body
      document.body.classList.add('eight-bit-mode');
      
      // Add scanline effect
      const scanlineEffect = document.createElement('div');
      scanlineEffect.className = 'scanline-effect';
      document.body.appendChild(scanlineEffect);
      
      // Regenerate colors if schedule exists to apply 8-bit palette
      if (schedule.length > 0) {
        const internalVolunteers = Object.keys(volunteerMap);
        setColors(generateColorsForIds(internalVolunteers, true));
      }
      
      return () => {
        // Clean up on unmount or when audioMode changes to false
        document.body.classList.remove('eight-bit-mode');
        const existingScanline = document.querySelector('.scanline-effect');
        if (existingScanline) {
          existingScanline.remove();
        }
      };
    } else {
      // Remove 8-bit class from body
      document.body.classList.remove('eight-bit-mode');
      
      // Remove scanline effect
      const existingScanline = document.querySelector('.scanline-effect');
      if (existingScanline) {
        existingScanline.remove();
      }
      
      // Regenerate colors with normal palette if schedule exists
      if (schedule.length > 0) {
        const internalVolunteers = Object.keys(volunteerMap);
        setColors(generateColorsForIds(internalVolunteers));
      }
    }
  }, [audioMode]);
  
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
      const internalVolunteers = Object.keys(volunteerMap);
      setColors(generateColorsForIds(internalVolunteers));
    }
  }, [darkMode, volunteerMap]);
  
  // Toggle date enabled
  const toggleDateEnabled = () => {
    setDateEnabled(prev => !prev);
  };
  
  // Handle title click for Easter egg
  const handleTitleClick = () => {
    const currentTime = new Date().getTime();
    
    // Reset counter if too much time between clicks (1.5 seconds)
    if (currentTime - lastTitleClickTime > 1500 && titleClickCount > 0) {
      setTitleClickCount(0);
    }
    
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);
    setLastTitleClickTime(currentTime);
    
    // Activate SMPW mode on 10th click
    if (newCount === 10) {
      setSmpwMode(true);
      setActivationMessage("SMPW Mode Activated!");
      setShowActivation(true);
      setTimeout(() => setShowActivation(false), 2000);
      // Don't reset counter here so we can count to 15
    }
    
    // Activate audio on 30th click (5 more after SMPW mode)
    if (newCount === 30) {
      setAudioMode(true);
      setActivationMessage("8-BIT MODE UNLOCKED!");
      setShowActivation(true);
      setTimeout(() => setShowActivation(false), 2000);
      setTitleClickCount(0); // Reset counter after 15 clicks
      
      // Play audio
      if (audioRef.current && !audioMuted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error('Audio playback failed:', e));
      }
    }
  };
  
  // Handle volunteer input change
  const handleVolunteerChange = (index, value) => {
    const newVolunteers = [...volunteers];
    newVolunteers[index] = value;
    setVolunteers(newVolunteers);
  };
  
  // Delete volunteer entry
  const deleteVolunteer = (index) => {
    // Prevent deletion if only 2 volunteers remain
    if (volunteers.length <= 2) {
      return;
    }
    
    const newVolunteers = [...volunteers];
    newVolunteers.splice(index, 1);
    setVolunteers(newVolunteers);
  };
  
  // Calculate end time 4 hours after start time
  const calculateEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHours = hours + 4;
    
    // Handle day overflow
    if (endHours >= 24) {
      endHours = endHours - 24;
    }
    
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
    } else if (field === 'startTime') {
      // Auto-calculate end time when start time changes
      const newEndTime = calculateEndTime(value);
      setTimeRange(prev => ({ 
        ...prev, 
        startTime: value,
        endTime: newEndTime 
      }));
    } else {
      setTimeRange(prev => ({ ...prev, [field]: value }));
    }
  };
  
  // Handle location name changes
  const handleLocationNameChange = (index, value) => {
    const newLocationNames = [...locationNames];
    newLocationNames[index] = value;
    setLocationNames(newLocationNames);
  };
  
  // Toggle multiple locations
  const handleMultipleLocationsChange = (e) => {
    const isChecked = e.target.checked;
    setMultipleLocations(isChecked);
    
    // Special behavior for SMPW mode
    if (smpwMode && isChecked) {
      // Set default location names for Eastern Market
      setLocationNames(["Fisher / Russell", "Market/Winder"]);
      
      // Add more volunteer slots
      if (volunteers.length < 9) {
        const additionalSlots = 9 - volunteers.length;
        const newVolunteers = [...volunteers];
        for (let i = 0; i < additionalSlots; i++) {
          newVolunteers.push('');
        }
        setVolunteers(newVolunteers);
      }
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
  
  // Generate colors for volunteer IDs
  const generateColorsForIds = (volunteerIds, use8BitPalette = false) => {
    const colorMap = {};
    
    // 8-bit color palette (NES inspired)
    const eightBitPalette = [
      { bg: '#D03800', text: '#FCFCFC' }, // Red
      { bg: '#007800', text: '#FCFCFC' }, // Green
      { bg: '#0058F8', text: '#FCFCFC' }, // Blue
      { bg: '#B800B8', text: '#FCFCFC' }, // Purple
      { bg: '#F83800', text: '#FCFCFC' }, // Orange
      { bg: '#008888', text: '#FCFCFC' }, // Teal
      { bg: '#6844FC', text: '#FCFCFC' }, // Indigo
      { bg: '#787878', text: '#FCFCFC' }, // Gray
      { bg: '#F8B800', text: '#000000' }, // Yellow
      { bg: '#00A844', text: '#FCFCFC' }  // Emerald
    ];
    
    // Different color palettes for light and dark mode
    const standardPalette = darkMode ? [
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
    
    // Choose which palette to use
    const colorPalette = use8BitPalette || audioMode ? eightBitPalette : standardPalette;
    
    volunteerIds.forEach((id, index) => {
      colorMap[id] = colorPalette[index % colorPalette.length];
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
        volunteers: [],
        // For multiple locations, add location-specific volunteer arrays
        locations: multipleLocations ? locationNames.map(name => ({ name, volunteers: [] })) : []
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
  // This is a more comprehensive version that works for both single and multiple locations
  const isVolunteerAvailable = (volunteer, slotIndex, assignedVolunteers) => {
    if (slotIndex <= 0) return true; // First slot has no constraints
    
    const previousSlot = assignedVolunteers[slotIndex - 1];
    
    // For multiple locations (nested array structure)
    if (Array.isArray(previousSlot) && Array.isArray(previousSlot[0])) {
      // Check if volunteer is in any location of previous slot
      return !previousSlot.some(locationVols => locationVols.includes(volunteer));
    } 
    // For single location (flat array structure)
    else {
      return !previousSlot.includes(volunteer);
    }
  };
  
  // Check if a volunteer is already scheduled in a specific time slot across all locations
  const isVolunteerInSlot = (volunteer, slotAssignments) => {
    if (Array.isArray(slotAssignments[0])) {
      // Multiple locations
      return slotAssignments.some(locationVols => locationVols.includes(volunteer));
    } else {
      // Single location
      return slotAssignments.includes(volunteer);
    }
  };
  
  // Create schedule for multiple locations
  const createMultiLocationSchedule = (volunteers, slots, randomize = false) => {
    // Apply randomness for shuffling if requested
    const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
    const numLocations = locationNames.length;
    
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
    
    // Track assignments for each location in each slot
    const assignedVolunteers = slots.map(() => 
      Array(numLocations).fill().map(() => [])
    );
    
    // First pass: Assign volunteers with availability constraint
    slots.forEach((slot, slotIndex) => {
      // For each location
      for (let locationIndex = 0; locationIndex < numLocations; locationIndex++) {
        // Find available volunteers for this location
        let availableVolunteers = filteredVolunteers.filter(v => {
          // Not already assigned to any location in this time slot
          const notInCurrentSlot = !isVolunteerInSlot(v, assignedVolunteers[slotIndex]);
          // Not in previous time slot (back-to-back constraint)
          const notInPreviousSlot = isVolunteerAvailable(v, slotIndex, assignedVolunteers);
          
          return notInCurrentSlot && notInPreviousSlot;
        });
        
        // If not enough available volunteers, will handle in second pass
        if (availableVolunteers.length < 2) {
          continue;
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
        
        // Find best partner for variety
        let bestPartner = null;
        let lowestPairCount = Infinity;
        
        // Similar partner selection logic as the original
        if (randomize && Math.random() < 0.4) {
          const possiblePartners = availableVolunteers.filter(v => v !== firstVolunteer);
          if (possiblePartners.length > 0) {
            bestPartner = possiblePartners[Math.floor(Math.random() * possiblePartners.length)];
          }
        } else {
          for (let i = 1; i < availableVolunteers.length; i++) {
            const partner = availableVolunteers[i];
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
          assignedVolunteers[slotIndex][locationIndex] = [firstVolunteer, bestPartner];
          shiftCounts[firstVolunteer]++;
          shiftCounts[bestPartner]++;
          pairCounts[`${firstVolunteer}-${bestPartner}`]++;
          pairCounts[`${bestPartner}-${firstVolunteer}`]++;
        }
      }
    });
    
    // Second pass: Fill in any slots that couldn't be filled with availability constraint
    slots.forEach((slot, slotIndex) => {
      for (let locationIndex = 0; locationIndex < numLocations; locationIndex++) {
        if (assignedVolunteers[slotIndex][locationIndex].length < 2) {
          let sortedVolunteers = [...filteredVolunteers];
          
          // Randomize and sort by shift count
          if (randomize) {
            sortedVolunteers = shuffleArray(sortedVolunteers);
          }
          sortedVolunteers.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
          
          // FIXED: Filter out volunteers already assigned to this time slot or previous time slot
          sortedVolunteers = sortedVolunteers.filter(v => {
            // Not already assigned to any location in this time slot
            const notInCurrentSlot = !isVolunteerInSlot(v, assignedVolunteers[slotIndex]);
            
            // Not in previous time slot (back-to-back constraint) - this was missing before
            const notInPreviousSlot = isVolunteerAvailable(v, slotIndex, assignedVolunteers);
            
            return notInCurrentSlot && notInPreviousSlot;
          });
          
          // Fill first position if needed
          if (assignedVolunteers[slotIndex][locationIndex].length === 0 && sortedVolunteers.length > 0) {
            const firstVolunteer = sortedVolunteers.shift();
            assignedVolunteers[slotIndex][locationIndex].push(firstVolunteer);
            shiftCounts[firstVolunteer]++;
          }
          
          // Fill second position, ensuring it's different from the first
          if (assignedVolunteers[slotIndex][locationIndex].length === 1) {
            const firstVolunteer = assignedVolunteers[slotIndex][locationIndex][0];
            const availableForSecond = sortedVolunteers.filter(v => v !== firstVolunteer);
            
            if (availableForSecond.length > 0) {
              const secondVolunteer = availableForSecond[0];
              assignedVolunteers[slotIndex][locationIndex].push(secondVolunteer);
              shiftCounts[secondVolunteer]++;
            } else {
              // Last resort - if we can't find someone who meets all constraints
              // Find someone who at least isn't in the current slot
              // Filter all volunteers who are not already in this time slot
              let lastResortCandidates = filteredVolunteers.filter(v => {
                return v !== firstVolunteer && !isVolunteerInSlot(v, assignedVolunteers[slotIndex]);
              });
              
              // Sort by shift count to maintain fairness
              lastResortCandidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
              
              if (lastResortCandidates.length > 0) {
                const secondVolunteer = lastResortCandidates[0];
                assignedVolunteers[slotIndex][locationIndex].push(secondVolunteer);
                shiftCounts[secondVolunteer]++;
              }
            }
          }
        }
      }
    });
    
    // Third pass (rare cases): If we still have unfilled slots, fill them regardless of constraints
    // This handles cases where there are too many slots and too few volunteers
    slots.forEach((slot, slotIndex) => {
      for (let locationIndex = 0; locationIndex < numLocations; locationIndex++) {
        if (assignedVolunteers[slotIndex][locationIndex].length < 2) {
          // Get all volunteers sorted by shift count
          let lastChanceVolunteers = [...filteredVolunteers];
          lastChanceVolunteers.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
          
          // Fill first position if needed
          if (assignedVolunteers[slotIndex][locationIndex].length === 0 && lastChanceVolunteers.length > 0) {
            const firstVolunteer = lastChanceVolunteers.find(v => !isVolunteerInSlot(v, assignedVolunteers[slotIndex])) || lastChanceVolunteers[0];
            assignedVolunteers[slotIndex][locationIndex].push(firstVolunteer);
            shiftCounts[firstVolunteer]++;
          }
          
          // Fill second position if needed
          if (assignedVolunteers[slotIndex][locationIndex].length === 1) {
            const firstVolunteer = assignedVolunteers[slotIndex][locationIndex][0];
            const secondVolunteer = lastChanceVolunteers.find(v => 
              v !== firstVolunteer && !isVolunteerInSlot(v, assignedVolunteers[slotIndex])
            ) || lastChanceVolunteers.find(v => v !== firstVolunteer) || (filteredVolunteers.length > 1 ? filteredVolunteers.find(v => v !== firstVolunteer) : filteredVolunteers[0]);
            
            if (secondVolunteer) {
              assignedVolunteers[slotIndex][locationIndex].push(secondVolunteer);
              shiftCounts[secondVolunteer]++;
            }
          }
        }
      }
    });
    
    return { assignments: assignedVolunteers, shiftCounts };
  };
  
  // Create schedule with even workload and maximized variety (original function for single location)
  const createSchedule = (volunteers, slots, randomize = false) => {
    // Handle multiple locations if that option is selected
    if (multipleLocations) {
      return createMultiLocationSchedule(volunteers, slots, randomize);
    }
    
    // Original single location code
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
        
        // Keep volunteers not scheduled in the previous slot
        sortedVolunteers = sortedVolunteers.filter(v => 
          isVolunteerAvailable(v, slotIndex, assignedVolunteers)
        );
        
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
          } else {
            // Last resort - try to find anyone not in the back-to-back slot
            const lastResortOptions = filteredVolunteers.filter(v => 
              v !== firstVolunteer && isVolunteerAvailable(v, slotIndex, assignedVolunteers)
            );
            
            if (lastResortOptions.length > 0) {
              const secondVolunteer = lastResortOptions[0];
              assignedVolunteers[slotIndex].push(secondVolunteer);
              shiftCounts[secondVolunteer]++;
            } else if (filteredVolunteers.length > 1) {
              // Absolute last resort - anyone different from the first volunteer
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
      }
    });
    
    return { assignments: assignedVolunteers, shiftCounts };
  };
  
  // Shuffle the schedule while maintaining rules
  const shuffleSchedule = () => {
    if (!schedule.length) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      // Use the already established volunteer map
      const internalVolunteers = Object.keys(volunteerMap);
      
      // Generate time slots
      const slots = generateTimeSlots(
        timeRange.startTime, 
        timeRange.endTime, 
        timeRange.isCustomInterval ? timeRange.customInterval : parseInt(timeRange.interval)
      );
      
      // Create shuffled schedule with randomization flag set to true
      const { assignments, shiftCounts } = createSchedule(internalVolunteers, slots, true);
      
      // Create final schedule
      let newSchedule;
      
      if (multipleLocations) {
        // For multiple locations
        newSchedule = slots.map((slot, index) => ({
          ...slot,
          volunteers: [], // Keep this for compatibility
          locations: locationNames.map((name, locIndex) => ({
            name,
            volunteers: assignments[index][locIndex] || []
          })),
          shiftCounts
        }));
      } else {
        // For single location
        newSchedule = slots.map((slot, index) => ({
          ...slot,
          volunteers: assignments[index],
          locations: [], // Keep this for compatibility
          shiftCounts
        }));
      }
      
      setSchedule(newSchedule);
      setConflicts([]);
      setIsLoading(false);
    }, 300);
  };
  
  // Check if we should increment the counter (once per hour)
  const shouldIncrementCounter = () => {
    const lastGenTime = localStorage.getItem('lastScheduleGeneration');
    const currentTime = new Date().getTime();
    
    // If no previous generation or it was more than an hour ago
    if (!lastGenTime || (currentTime - parseInt(lastGenTime) > 3600000)) {
      localStorage.setItem('lastScheduleGeneration', currentTime.toString());
      return true;
    }
    
    return false;
  };
  
  // Generate the schedule
  const generateSchedule = () => {
    const filteredVolunteers = volunteers.filter(v => v.trim() !== '');
    
    const minVolunteers = multipleLocations ? 4 : 2;
    if (filteredVolunteers.length < minVolunteers) {
      alert(`Please add at least ${minVolunteers} volunteers`);
      return;
    }
    
    setIsLoading(true);
    setDuplicateError(null);
    
    // Simulate loading for better UX
    setTimeout(() => {
      // Generate internal IDs for each volunteer while preserving their display names
      const newVolunteerMap = {};
      const internalVolunteers = filteredVolunteers.map((name, index) => {
        const internalId = `volunteer-${index}`;
        newVolunteerMap[internalId] = name.trim();
        return internalId;
      });
      setVolunteerMap(newVolunteerMap);
      
      // Generate colors - now using internal IDs
      const colorMap = generateColorsForIds(internalVolunteers, audioMode);
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
      
      // Create schedule with the internal IDs
      const { assignments, shiftCounts } = createSchedule(internalVolunteers, slots, false);
      
      // Create final schedule
      let newSchedule;
      
      if (multipleLocations) {
        // For multiple locations
        newSchedule = slots.map((slot, index) => ({
          ...slot,
          volunteers: [], // Keep this for compatibility
          locations: locationNames.map((name, locIndex) => ({
            name,
            volunteers: assignments[index][locIndex] || []
          })),
          shiftCounts
        }));
      } else {
        // For single location
        newSchedule = slots.map((slot, index) => ({
          ...slot,
          volunteers: assignments[index],
          locations: [], // Keep this for compatibility
          shiftCounts
        }));
      }
      
      setSchedule(newSchedule);
      setConflicts([]);
      setIsLoading(false);
      
      // Check if we should increment counter (hourly limit)
      if (shouldIncrementCounter()) {
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
      }
    }, 500);
  };
  
  // Update a volunteer in the schedule
  const updateScheduleVolunteer = (slotIndex, volunteerIndex, newVolunteer, locationIndex = null) => {
    const updatedSchedule = [...schedule];
    
    if (multipleLocations && locationIndex !== null) {
      // For multiple locations
      const currentSlot = updatedSchedule[slotIndex];
      const currentLocation = currentSlot.locations[locationIndex];
      
      // Check if this would create a duplicate in the same shift at this location
      const otherIndex = volunteerIndex === 0 ? 1 : 0;
      if (newVolunteer && newVolunteer === currentLocation.volunteers[otherIndex]) {
        setDuplicateError({
          slotIndex,
          locationIndex,
          message: `${volunteerMap[newVolunteer] || newVolunteer} is already assigned to this shift`
        });
        return; // Don't update if it would create a duplicate
      }
      
      // Check if volunteer is already assigned to another location in this slot
      const isAssignedElsewhere = currentSlot.locations.some((loc, idx) => 
        idx !== locationIndex && loc.volunteers.includes(newVolunteer)
      );
      
      if (isAssignedElsewhere) {
        setDuplicateError({
          slotIndex,
          locationIndex,
          message: `${volunteerMap[newVolunteer] || newVolunteer} is already assigned to another location in this time slot`
        });
        return;
      }
      
      // Clear any existing duplicate error
      if (duplicateError && 
          duplicateError.slotIndex === slotIndex && 
          duplicateError.locationIndex === locationIndex) {
        setDuplicateError(null);
      }
      
      // Update the volunteer
      updatedSchedule[slotIndex].locations[locationIndex].volunteers[volunteerIndex] = newVolunteer;
    } else {
      // For single location - original logic
      const currentSlot = updatedSchedule[slotIndex];
      
      // Check if this would create a duplicate in the same shift
      const otherIndex = volunteerIndex === 0 ? 1 : 0;
      if (newVolunteer && newVolunteer === currentSlot.volunteers[otherIndex]) {
        setDuplicateError({
          slotIndex,
          message: `${volunteerMap[newVolunteer] || newVolunteer} is already assigned to this shift`
        });
        return; // Don't update if it would create a duplicate
      }
      
      // Clear any existing duplicate error
      if (duplicateError && duplicateError.slotIndex === slotIndex) {
        setDuplicateError(null);
      }
      
      // Update the volunteer
      updatedSchedule[slotIndex].volunteers[volunteerIndex] = newVolunteer;
    }
    
    // Update shift counts
    const shiftCounts = {};
    Object.keys(volunteerMap).forEach(id => {
      shiftCounts[id] = 0;
    });
    
    updatedSchedule.forEach(slot => {
      if (multipleLocations) {
        // Count shifts across all locations
        slot.locations.forEach(location => {
          location.volunteers.forEach(v => {
            if (v && shiftCounts[v] !== undefined) {
              shiftCounts[v]++;
            }
          });
        });
      } else {
        // Original counting logic
        slot.volunteers.forEach(v => {
          if (v && shiftCounts[v] !== undefined) {
            shiftCounts[v]++;
          }
        });
      }
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
        
        if (multipleLocations) {
          // For multiple locations
          slot.locations.forEach((location, locIndex) => {
            location.volunteers.forEach(volunteer => {
              // Check if volunteer was in any location in the previous slot
              const wasInPreviousSlot = previousSlot.locations.some(
                prevLoc => prevLoc.volunteers.includes(volunteer)
              );
              
              if (wasInPreviousSlot) {
                newConflicts.push({
                  slotIndex: index,
                  locationIndex: locIndex,
                  volunteer: volunteer
                });
              }
            });
          });
        } else {
          // Original conflict checking
          slot.volunteers.forEach(volunteer => {
            if (previousSlot.volunteers.includes(volunteer)) {
              newConflicts.push({
                slotIndex: index,
                volunteer: volunteer
              });
            }
          });
        }
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
        volunteerColumnWidth: multipleLocations ? 260 : 300, // Adjust width for multiple locations
        legendHeight: 40,
        cornerRadius: audioMode ? 0 : 2, // No rounded corners in 8-bit mode
        borderColor: darkMode ? '#4a5568' : '#e2e8f0',
        headerBgColor: darkMode ? '#2d3748' : '#f7fafc',
        alternateRowColor: darkMode ? '#2d3748' : '#f7fafc',
        mainRowColor: darkMode ? '#1a202c' : '#ffffff',
        textColor: darkMode ? '#e2e8f0' : '#1a202c',
        mutedTextColor: darkMode ? '#a0aec0' : '#4a5568',
        fontFamily: audioMode ? '"Press Start 2P", cursive' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        pixelRatio: 2 // For higher resolution
      };
      
      // Calculate canvas dimensions
      const totalVolunteerWidth = multipleLocations 
        ? config.volunteerColumnWidth * locationNames.length 
        : config.volunteerColumnWidth;
      
      const width = config.timeColumnWidth + totalVolunteerWidth + config.padding * 2;
      let height = config.headerHeight + ((schedule.length + 1) * config.rowHeight) + config.legendHeight + config.padding * 2;
      
      // Add space for scriptural point if in SMPW mode
      let scripturalPointHeight = 0;
      if (smpwMode && scripturalPoint) {
        // Estimate height based on text length (rough estimate)
        const textLength = scripturalPoint.length;
        const charsPerLine = audioMode ? 30 : 50; // Fewer chars per line in 8-bit mode
        const lines = Math.ceil(textLength / charsPerLine);
        scripturalPointHeight = lines * 16 + 40; // 16px per line + padding
        height += scripturalPointHeight;
      }
      
      // Set canvas size with pixel ratio for high resolution
      canvas.width = width * config.pixelRatio;
      canvas.height = height * config.pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(config.pixelRatio, config.pixelRatio);
      
      // Apply anti-aliasing - disable for 8-bit mode
      ctx.imageSmoothingEnabled = !audioMode;
      if (!audioMode) {
        ctx.imageSmoothingQuality = 'high';
      }
      
      // Fill background
      ctx.fillStyle = darkMode ? '#1a202c' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Add scanlines in 8-bit mode
      if (audioMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < height; i += 2) {
          ctx.fillRect(0, i, width, 1);
        }
      }
      
      // Draw header
      ctx.fillStyle = darkMode ? '#ffffff' : '#1a202c';
      ctx.font = `${audioMode ? '' : 'bold '}${audioMode ? '12' : '16'}px ${config.fontFamily}`;
      ctx.textAlign = 'center';
      const displayTitle = locationName ? `${locationName} Schedule` : 'Schedule';
      ctx.fillText(displayTitle, width / 2, config.padding + 20);
      
      // Draw date/time - only if date is enabled
      ctx.font = `${audioMode ? '8' : '12'}px ${config.fontFamily}`;
      ctx.fillStyle = config.mutedTextColor;
      
      let headerText = '';
      if (dateEnabled) {
        const dateStr = formatDate(timeRange.date);
        const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
        headerText = `${dateStr} • ${timeStr}`;
      } else {
        headerText = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
      }
      
      ctx.fillText(headerText, width / 2, config.padding + 40);
      
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
      ctx.lineWidth = audioMode ? 2 : 1; // Thicker borders in 8-bit mode
      
      // Outer border
      ctx.strokeRect(config.padding, tableTop, tableWidth, tableHeight);
      
      // Vertical dividers for columns - draw AFTER the row backgrounds
      if (multipleLocations) {
        // Divider between time and first location
        ctx.beginPath();
        ctx.moveTo(config.padding + config.timeColumnWidth, tableTop);
        ctx.lineTo(config.padding + config.timeColumnWidth, tableTop + tableHeight);
        ctx.stroke();
        
        // Dividers between locations
        for (let i = 1; i < locationNames.length; i++) {
          const dividerX = config.padding + config.timeColumnWidth + (i * config.volunteerColumnWidth);
          ctx.beginPath();
          ctx.moveTo(dividerX, tableTop);
          ctx.lineTo(dividerX, tableTop + tableHeight);
          ctx.stroke();
        }
      } else {
        // Original single divider
        ctx.beginPath();
        ctx.moveTo(config.padding + config.timeColumnWidth, tableTop);
        ctx.lineTo(config.padding + config.timeColumnWidth, tableTop + tableHeight);
        ctx.stroke();
      }
      
      // Horizontal grid lines - draw AFTER the row backgrounds
      for (let i = 1; i <= schedule.length + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(config.padding, tableTop + i * config.rowHeight);
        ctx.lineTo(width - config.padding, tableTop + i * config.rowHeight);
        ctx.stroke();
      }
      
      // Draw header text
      ctx.fillStyle = config.textColor;
      ctx.font = `${audioMode ? '8' : '500 12'}px ${config.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('Time', config.padding + 10, tableTop + config.rowHeight / 2 + 5);
      
      if (multipleLocations) {
        // Location headers
        locationNames.forEach((name, locIndex) => {
          const locX = config.padding + config.timeColumnWidth + (locIndex * config.volunteerColumnWidth);
          ctx.textAlign = 'center';
          
          // Handle 8-bit mode - truncate/resize text if needed
          let displayName = name;
          if (audioMode) {
            // Measure text width
            const maxWidth = config.volunteerColumnWidth - 10; // Allow some padding
            const textWidth = ctx.measureText(name).width;
            
            // Truncate if too long
            if (textWidth > maxWidth) {
              // Try to fit with ellipsis
              let truncated = name;
              while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              displayName = truncated + (truncated.length < name.length ? '...' : '');
            }
          }
          
          ctx.fillText(displayName, locX + config.volunteerColumnWidth / 2, tableTop + config.rowHeight / 2 + 5);
        });
      } else {
        // Original volunteers header
        ctx.textAlign = 'center';
        ctx.fillText('Volunteers', config.padding + config.timeColumnWidth + config.volunteerColumnWidth / 2, 
                  tableTop + config.rowHeight / 2 + 5);
      }
      
      // Draw schedule rows (data rows)
      schedule.forEach((slot, index) => {
        // Calculate row position (offset by header row)
        const y = tableTop + config.rowHeight + (index * config.rowHeight);
        
        // Time text
ctx.fillStyle = config.textColor;
// Always use the smaller font size for 8-bit mode time column for consistency
ctx.font = audioMode ? `6px ${config.fontFamily}` : `500 12px ${config.fontFamily}`;
ctx.textAlign = 'left';
ctx.fillText(slot.compactDisplay, config.padding + 10, y + config.rowHeight / 2 + 5);
        
        if (multipleLocations) {
          // Draw volunteer boxes for each location
          slot.locations.forEach((location, locIndex) => {
            const locX = config.padding + config.timeColumnWidth + (locIndex * config.volunteerColumnWidth);
            
            // Draw volunteer boxes
            const volunteerWidth = config.volunteerColumnWidth / 2 - 8;
            location.volunteers.forEach((volunteerId, vIndex) => {
              if (!volunteerId) return;
              
              const displayName = volunteerMap[volunteerId] || volunteerId;
              const vx = locX + 4 + vIndex * (volunteerWidth + 8);
              const vy = y + 5;
              const vHeight = config.rowHeight - 10;
              
              // Volunteer background - draw a rounded rectangle or square in 8-bit mode
              const radius = config.cornerRadius;
              ctx.fillStyle = colors[volunteerId]?.bg || config.alternateRowColor;
              
              if (audioMode) {
                // Square box for 8-bit mode
                ctx.fillRect(vx, vy, volunteerWidth, vHeight);
                // Draw border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(vx, vy, volunteerWidth, vHeight);
              } else {
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
              }
              
              // Volunteer text with truncation for 8-bit mode
              ctx.fillStyle = colors[volunteerId]?.text || config.textColor;
              
              // Handle text sizing in 8-bit mode
              if (audioMode) {
                const maxVolWidth = volunteerWidth - 6; // Allow some padding
                ctx.font = `8px ${config.fontFamily}`;
                let truncated = displayName;
                
                // Measure and truncate if needed
                if (ctx.measureText(displayName).width > maxVolWidth) {
                  while (ctx.measureText(truncated + '...').width > maxVolWidth && truncated.length > 0) {
                    truncated = truncated.slice(0, -1);
                  }
                  truncated = truncated + (truncated.length < displayName.length ? '...' : '');
                }
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(truncated, vx + volunteerWidth / 2, vy + vHeight / 2);
              } else {
                // Normal mode
                ctx.font = `11px ${config.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayName, vx + volunteerWidth / 2, vy + vHeight / 2);
              }
              
              ctx.textBaseline = 'alphabetic';
            });
          });
        } else {
          // Original volunteer rendering for single location
          const volunteerWidth = config.volunteerColumnWidth / 2 - 8;
          slot.volunteers.forEach((volunteerId, vIndex) => {
            if (!volunteerId) return;
            
            const displayName = volunteerMap[volunteerId] || volunteerId;
            const vx = config.padding + config.timeColumnWidth + 4 + vIndex * (volunteerWidth + 8);
            const vy = y + 5;
            const vHeight = config.rowHeight - 10;
            
            // Volunteer background
            const radius = config.cornerRadius;
            ctx.fillStyle = colors[volunteerId]?.bg || config.alternateRowColor;
            
            if (audioMode) {
              // Square box for 8-bit mode
              ctx.fillRect(vx, vy, volunteerWidth, vHeight);
              // Draw border
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.strokeRect(vx, vy, volunteerWidth, vHeight);
            } else {
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
            }
            
            // Volunteer text
            ctx.fillStyle = colors[volunteerId]?.text || config.textColor;
            
            // Handle text sizing in 8-bit mode
            if (audioMode) {
              const maxVolWidth = volunteerWidth - 6; // Allow some padding
              ctx.font = `8px ${config.fontFamily}`;
              let truncated = displayName;
              
              // Measure and truncate if needed
              if (ctx.measureText(displayName).width > maxVolWidth) {
                while (ctx.measureText(truncated + '...').width > maxVolWidth && truncated.length > 0) {
                  truncated = truncated.slice(0, -1);
                }
                truncated = truncated + (truncated.length < displayName.length ? '...' : '');
              }
              
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(truncated, vx + volunteerWidth / 2, vy + vHeight / 2);
            } else {
              // Normal mode
              ctx.font = `11px ${config.fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(displayName, vx + volunteerWidth / 2, vy + vHeight / 2);
            }
            
            ctx.textBaseline = 'alphabetic';
          });
        }
      });
      
      // Draw legend
      const legendY = tableTop + tableHeight + 10;
      const shiftCounts = schedule[0]?.shiftCounts || {};
      const volunteers = Object.keys(shiftCounts);
      
      let legendX = config.padding;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      volunteers.forEach(volunteerId => {
        const count = shiftCounts[volunteerId];
        const displayName = volunteerMap[volunteerId] || volunteerId;
        
        // Adjust for 8-bit mode
        ctx.font = `${audioMode ? '8' : '11'}px ${config.fontFamily}`;
        
        // Handle truncation for 8-bit mode
        let legendText;
        if (audioMode) {
          // Keep shorter in 8-bit mode
          const maxNameLength = 8; // arbitrary limit for legend
          let truncName = displayName;
          if (truncName.length > maxNameLength) {
            truncName = truncName.substring(0, maxNameLength - 1) + '…';
          }
          legendText = `${truncName}:${count}`;
        } else {
          legendText = `${displayName}:${count}`;
        }
        
        const textWidth = ctx.measureText(legendText).width;
        const legendWidth = textWidth + 16;
        const legendHeight = 18;
        const radius = config.cornerRadius;
        
        // Background
        ctx.fillStyle = colors[volunteerId]?.bg || config.alternateRowColor;
        
        if (audioMode) {
          // Square box for 8-bit mode
          ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
          // Draw border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
        } else {
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
        }
        
        // Text
        ctx.fillStyle = colors[volunteerId]?.text || config.textColor;
        ctx.fillText(legendText, legendX + legendWidth / 2, legendY + legendHeight / 2);
        
        legendX += legendWidth + 6;
      });
      
      // Draw scriptural point if in SMPW mode
      if (smpwMode && scripturalPoint) {
        const scriptureY = legendY + 30;
        const scriptureWidth = width - config.padding * 2;
        
        // Draw scripture box background
        ctx.fillStyle = darkMode ? '#2d3748' : '#f7fafc';
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = audioMode ? 2 : 1;
        
        // Draw box
        if (audioMode) {
          // Square box for 8-bit mode
          ctx.fillRect(config.padding, scriptureY, scriptureWidth, scripturalPointHeight);
          ctx.strokeRect(config.padding, scriptureY, scriptureWidth, scripturalPointHeight);
        } else {
          ctx.fillRect(config.padding, scriptureY, scriptureWidth, scripturalPointHeight);
          ctx.strokeRect(config.padding, scriptureY, scriptureWidth, scripturalPointHeight);
        }
        
        // Measure and wrap text
        ctx.font = `${audioMode ? '8' : '12'}px ${config.fontFamily}`;
        const maxWidth = scriptureWidth - 20;
        const words = scripturalPoint.split(' ');
        const lines = [];
        let currentLine = '';
        
        // Break text into lines
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        // Draw heading
        ctx.fillStyle = config.textColor;
        ctx.font = `${audioMode ? 'bold 8' : 'bold 13'}px ${config.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText('Scriptural Discussion', config.padding + 10, scriptureY + 18);
        
        // Draw text content
        ctx.font = `${audioMode ? '8' : '12'}px ${config.fontFamily}`;
        const lineHeight = audioMode ? 12 : 16;
        lines.forEach((line, i) => {
          ctx.fillText(line, config.padding + 10, scriptureY + 36 + (i * lineHeight));
        });
      }
      
      // Convert canvas to blob for sharing
      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const imageUrl = canvas.toDataURL('image/png');
      
      // Create file name
      const dateString = dateEnabled ? timeRange.date.replace(/-/g, '') : 'nodate';
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
        volunteerColumnWidth: multipleLocations ? 260 : 300, // Adjust for multiple locations
        legendHeight: 40,
        cornerRadius: audioMode ? 0 : 2, // No rounded corners in 8-bit mode
        borderColor: darkMode ? '#4a5568' : '#e2e8f0',
        headerBgColor: darkMode ? '#2d3748' : '#f7fafc',
        alternateRowColor: darkMode ? '#2d3748' : '#f7fafc',
        mainRowColor: darkMode ? '#1a202c' : '#ffffff',
        textColor: darkMode ? '#e2e8f0' : '#1a202c',
        mutedTextColor: darkMode ? '#a0aec0' : '#4a5568',
        fontFamily: audioMode ? '"Press Start 2P", cursive' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        pixelRatio: 2 // For higher resolution
      };
      
      // Calculate canvas dimensions
      const totalVolunteerWidth = multipleLocations 
        ? config.volunteerColumnWidth * locationNames.length 
        : config.volunteerColumnWidth;
      
      const width = config.timeColumnWidth + totalVolunteerWidth + config.padding * 2;
      let height = config.headerHeight + ((schedule.length + 1) * config.rowHeight) + config.legendHeight + config.padding * 2;
      
      // Add space for scriptural point if in SMPW mode
      let scripturalPointHeight = 0;
      if (smpwMode && scripturalPoint) {
        // Estimate height based on text length (rough estimate)
        const textLength = scripturalPoint.length;
        const charsPerLine = audioMode ? 30 : 50; // Fewer chars per line in 8-bit mode
        const lines = Math.ceil(textLength / charsPerLine);
        scripturalPointHeight = lines * 16 + 40; // 16px per line + padding
        height += scripturalPointHeight;
      }
      
      // Set canvas size with pixel ratio for high resolution
      canvas.width = width * config.pixelRatio;
      canvas.height = height * config.pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      ctx.scale(config.pixelRatio, config.pixelRatio);
      
      // Apply anti-aliasing - disable for 8-bit mode
      ctx.imageSmoothingEnabled = !audioMode;
      if (!audioMode) {
        ctx.imageSmoothingQuality = 'high';
      }
      
      // Fill background
      ctx.fillStyle = darkMode ? '#1a202c' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Add scanlines in 8-bit mode
      if (audioMode) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < height; i += 2) {
          ctx.fillRect(0, i, width, 1);
        }
      }
      
      // Draw header
      ctx.fillStyle = darkMode ? '#ffffff' : '#1a202c';
      ctx.font = `${audioMode ? '' : 'bold '}${audioMode ? '12' : '16'}px ${config.fontFamily}`;
      ctx.textAlign = 'center';
      const displayTitle = locationName ? `${locationName} Schedule` : 'Schedule';
      ctx.fillText(displayTitle, width / 2, config.padding + 20);
      
      // Draw date/time - only if date is enabled
      ctx.font = `${audioMode ? '8' : '12'}px ${config.fontFamily}`;
      ctx.fillStyle = config.mutedTextColor;
      
      let headerText = '';
      if (dateEnabled) {
        const dateStr = formatDate(timeRange.date);
        const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
        headerText = `${dateStr} • ${timeStr}`;
      } else {
        headerText = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
      }
      
      ctx.fillText(headerText, width / 2, config.padding + 40);
      
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
      ctx.lineWidth = audioMode ? 2 : 1; // Thicker borders in 8-bit mode
      
      // Outer border
      ctx.strokeRect(config.padding, tableTop, tableWidth, tableHeight);
      
      // Vertical dividers for columns - draw AFTER the row backgrounds
      if (multipleLocations) {
        // Divider between time and first location
        ctx.beginPath();
        ctx.moveTo(config.padding + config.timeColumnWidth, tableTop);
        ctx.lineTo(config.padding + config.timeColumnWidth, tableTop + tableHeight);
        ctx.stroke();
        
        // Dividers between locations
        for (let i = 1; i < locationNames.length; i++) {
          const dividerX = config.padding + config.timeColumnWidth + (i * config.volunteerColumnWidth);
          ctx.beginPath();
          ctx.moveTo(dividerX, tableTop);
          ctx.lineTo(dividerX, tableTop + tableHeight);
          ctx.stroke();
        }
      } else {
        // Original single divider
        ctx.beginPath();
        ctx.moveTo(config.padding + config.timeColumnWidth, tableTop);
        ctx.lineTo(config.padding + config.timeColumnWidth, tableTop + tableHeight);
        ctx.stroke();
      }
      
      // Horizontal grid lines - draw AFTER the row backgrounds
      for (let i = 1; i <= schedule.length + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(config.padding, tableTop + i * config.rowHeight);
        ctx.lineTo(width - config.padding, tableTop + i * config.rowHeight);
        ctx.stroke();
      }
      
      // Draw header text
      ctx.fillStyle = config.textColor;
      ctx.font = `${audioMode ? '8' : '500 12'}px ${config.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.fillText('Time', config.padding + 10, tableTop + config.rowHeight / 2 + 5);
      
      if (multipleLocations) {
        // Location headers
        locationNames.forEach((name, locIndex) => {
          const locX = config.padding + config.timeColumnWidth + (locIndex * config.volunteerColumnWidth);
          ctx.textAlign = 'center';
          
          // Handle 8-bit mode - truncate/resize text if needed
          let displayName = name;
          if (audioMode) {
            // Measure text width
            const maxWidth = config.volunteerColumnWidth - 10; // Allow some padding
            const textWidth = ctx.measureText(name).width;
            
            // Truncate if too long
            if (textWidth > maxWidth) {
              // Try to fit with ellipsis
              let truncated = name;
              while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              displayName = truncated + (truncated.length < name.length ? '...' : '');
            }
          }
          
          ctx.fillText(displayName, locX + config.volunteerColumnWidth / 2, tableTop + config.rowHeight / 2 + 5);
        });
      } else {
        // Original volunteers header
        ctx.textAlign = 'center';
        ctx.fillText('Volunteers', config.padding + config.timeColumnWidth + config.volunteerColumnWidth / 2, 
                  tableTop + config.rowHeight / 2 + 5);
      }
      
      // Draw schedule rows (data rows)
      schedule.forEach((slot, index) => {
        // Calculate row position (offset by header row)
        const y = tableTop + config.rowHeight + (index * config.rowHeight);
        
        // Time text
ctx.fillStyle = config.textColor;
// Always use the smaller font size for 8-bit mode time column for consistency
ctx.font = audioMode ? `6px ${config.fontFamily}` : `500 12px ${config.fontFamily}`;
ctx.textAlign = 'left';
ctx.fillText(slot.compactDisplay, config.padding + 10, y + config.rowHeight / 2 + 5);
        
        if (multipleLocations) {
          // Draw volunteer boxes for each location
          slot.locations.forEach((location, locIndex) => {
            const locX = config.padding + config.timeColumnWidth + (locIndex * config.volunteerColumnWidth);
            
            // Draw volunteer boxes
            const volunteerWidth = config.volunteerColumnWidth / 2 - 8;
            location.volunteers.forEach((volunteerId, vIndex) => {
              if (!volunteerId) return;
              
              const displayName = volunteerMap[volunteerId] || volunteerId;
              const vx = locX + 4 + vIndex * (volunteerWidth + 8);
              const vy = y + 5;
              const vHeight = config.rowHeight - 10;
              
              // Volunteer background - draw a rounded rectangle or square in 8-bit mode
              const radius = config.cornerRadius;
              ctx.fillStyle = colors[volunteerId]?.bg || config.alternateRowColor;
              
              if (audioMode) {
                // Square box for 8-bit mode
                ctx.fillRect(vx, vy, volunteerWidth, vHeight);
                // Draw border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(vx, vy, volunteerWidth, vHeight);
              } else {
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
              }
              
              // Volunteer text with truncation for 8-bit mode
              ctx.fillStyle = colors[volunteerId]?.text || config.textColor;
              
              // Handle text sizing in 8-bit mode
              if (audioMode) {
                const maxVolWidth = volunteerWidth - 6; // Allow some padding
                ctx.font = `8px ${config.fontFamily}`;
                let truncated = displayName;
                
                // Measure and truncate if needed
                if (ctx.measureText(displayName).width > maxVolWidth) {
                  while (ctx.measureText(truncated + '...').width > maxVolWidth && truncated.length > 0) {
                    truncated = truncated.slice(0, -1);
                  }
                  truncated = truncated + (truncated.length < displayName.length ? '...' : '');
                }
                
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(truncated, vx + volunteerWidth / 2, vy + vHeight / 2);
              } else {
                // Normal mode
                ctx.font = `11px ${config.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(displayName, vx + volunteerWidth / 2, vy + vHeight / 2);
              }
              
              ctx.textBaseline = 'alphabetic';
            });
          });
        } else {
          // Original volunteer rendering for single location
          const volunteerWidth = config.volunteerColumnWidth / 2 - 8;
          slot.volunteers.forEach((volunteerId, vIndex) => {
            if (!volunteerId) return;
            
            const displayName = volunteerMap[volunteerId] || volunteerId;
            const vx = config.padding + config.timeColumnWidth + 4 + vIndex * (volunteerWidth + 8);
            const vy = y + 5;
            const vHeight = config.rowHeight - 10;
            
            // Volunteer background
            const radius = config.cornerRadius;
            ctx.fillStyle = colors[volunteerId]?.bg || config.alternateRowColor;
            
            if (audioMode) {
              // Square box for 8-bit mode
              ctx.fillRect(vx, vy, volunteerWidth, vHeight);
              // Draw border
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.strokeRect(vx, vy, volunteerWidth, vHeight);
            } else {
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
            }
            
            // Volunteer text
            ctx.fillStyle = colors[volunteerId]?.text || config.textColor;
            
            // Handle text sizing in 8-bit mode
            if (audioMode) {
              const maxVolWidth = volunteerWidth - 6; // Allow some padding
              ctx.font = `8px ${config.fontFamily}`;
              let truncated = displayName;
              
              // Measure and truncate if needed
              if (ctx.measureText(displayName).width > maxVolWidth) {
                while (ctx.measureText(truncated + '...').width > maxVolWidth && truncated.length > 0) {
                  truncated = truncated.slice(0, -1);
                }
                truncated = truncated + (truncated.length < displayName.length ? '...' : '');
              }ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(truncated, vx + volunteerWidth / 2, vy + vHeight / 2);
            } else {
              // Normal mode
              ctx.font = `11px ${config.fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(displayName, vx + volunteerWidth / 2, vy + vHeight / 2);
            }
            
            ctx.textBaseline = 'alphabetic';
          });
        }
      });
      
      // Draw legend
      const legendY = tableTop + tableHeight + 10;
      const shiftCounts = schedule[0]?.shiftCounts || {};
      const volunteers = Object.keys(shiftCounts);
      
      let legendX = config.padding;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${audioMode ? '8' : '11'}px ${config.fontFamily}`;
      
      volunteers.forEach(volunteerId => {
        const count = shiftCounts[volunteerId];
        const displayName = volunteerMap[volunteerId] || volunteerId;
        
        // Handle truncation for 8-bit mode
        let legendText;
        if (audioMode) {
          // Keep shorter in 8-bit mode
          const maxNameLength = 8; // arbitrary limit for legend
          let truncName = displayName;
          if (truncName.length > maxNameLength) {
            truncName = truncName.substring(0, maxNameLength - 1) + '…';
          }
          legendText = `${truncName}:${count}`;
        } else {
          legendText = `${displayName}:${count}`;
        }
        
        const textWidth = ctx.measureText(legendText).width;
        const legendWidth = textWidth + 16;
        const legendHeight = 18;
        const radius = config.cornerRadius;
        
        // Background
        ctx.fillStyle = colors[volunteerId]?.bg || config.alternateRowColor;
        
        if (audioMode) {
          // Square box for 8-bit mode
          ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
          // Draw border
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
        } else {
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
        }
        
        // Text
        ctx.fillStyle = colors[volunteerId]?.text || config.textColor;
        ctx.fillText(legendText, legendX + legendWidth / 2, legendY + legendHeight / 2);
        
        legendX += legendWidth + 6;
      });
      
      // Draw scriptural point if in SMPW mode
      if (smpwMode && scripturalPoint) {
        const scriptureY = legendY + 30;
        const scriptureWidth = width - config.padding * 2;
        
        // Draw scripture box background
        ctx.fillStyle = darkMode ? '#2d3748' : '#f7fafc';
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = audioMode ? 2 : 1;
        
        // Measure and wrap text
        ctx.font = `${audioMode ? '8' : '12'}px ${config.fontFamily}`;
        const maxWidth = scriptureWidth - 20;
        const words = scripturalPoint.split(' ');
        const lines = [];
        let currentLine = '';
        
        // Break text into lines
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        // Calculate box height based on text
        const lineHeight = audioMode ? 12 : 16;
        const textHeight = lines.length * lineHeight;
        const boxHeight = textHeight + 30;
        
        // Draw box
        ctx.fillRect(config.padding, scriptureY, scriptureWidth, boxHeight);
        ctx.strokeRect(config.padding, scriptureY, scriptureWidth, boxHeight);
        
        // Draw heading
        ctx.fillStyle = config.textColor;
        ctx.font = `${audioMode ? 'bold 8' : 'bold 13'}px ${config.fontFamily}`;
        ctx.textAlign = 'left';
        ctx.fillText('Scriptural Discussion', config.padding + 10, scriptureY + 18);
        
        // Draw text content
        ctx.font = `${audioMode ? '8' : '12'}px ${config.fontFamily}`;
        lines.forEach((line, i) => {
          ctx.fillText(line, config.padding + 10, scriptureY + 36 + (i * lineHeight));
        });
      }
      
      // Convert to image and download
      const image = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const dateString = dateEnabled ? timeRange.date.replace(/-/g, '') : 'nodate';
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
    
    const dateStr = dateEnabled ? formatDate(timeRange.date) : "";
    const timeStr = `${formatTo12Hour(timeRange.startTime)}-${formatTo12Hour(timeRange.endTime)}`;
    const shiftCounts = schedule[0]?.shiftCounts || {};
    const displayTitle = locationName ? `${locationName} Schedule` : `Schedule`;
    
    return (
      <div className={`fixed inset-0 ${darkMode ? 'bg-gray-900' : 'bg-white'} z-50 overflow-auto ${audioMode ? 'eight-bit-container' : ''}`}>
        <div className="relative max-w-md mx-auto">
          {/* Controls - with better spacing for mobile */}
          <div className="absolute top-2 right-2 flex space-x-2">
            <button 
              onClick={toggleDarkMode}
              className={`p-2 ${audioMode ? 'eight-bit-button' : 'rounded-full'} ${darkMode ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={downloadScheduleImage}
              className={`p-2 ${audioMode ? 'eight-bit-button' : 'rounded-full'} ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'} download-btn`}
              aria-label="Download schedule"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={showSaveHelp}
              className={`p-2 ${audioMode ? 'eight-bit-button' : 'rounded-full'} ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Help with saving"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => setScreenshotMode(false)}
              className={`p-2 ${audioMode ? 'eight-bit-button' : 'rounded-full'} ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Close screenshot mode"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Increased top padding to prevent controls overlap */}
          <div className="pt-12 pb-2 px-3" ref={scheduleRef}>
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} ${audioMode ? 'eight-bit-text' : ''}`}>{displayTitle}</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} ${audioMode ? 'eight-bit-text' : ''}`}>
                {dateEnabled ? `${dateStr} • ${timeStr}` : timeStr}
              </p>
            </div>
            
            {/* Compact Schedule Table - Using pure HTML table for better rendering */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              borderSpacing: 0,
              fontSize: '12px',
              marginBottom: '8px',
              border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
              fontFamily: audioMode ? '"Press Start 2P", cursive' : 'inherit',
              ...(audioMode ? { imageRendering: 'pixelated', borderWidth: '2px' } : {})
            }}><thead>
            <tr style={{ 
              background: darkMode ? '#2d3748' : '#f7fafc'
            }}>
              <th style={{ 
                border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                padding: '4px 4px',
                textAlign: 'left',
                fontWeight: '500',
                color: darkMode ? '#e2e8f0' : '#1a202c',
                ...(audioMode ? { borderWidth: '2px', fontSize: '10px' } : {})
              }}>
                Time
              </th>
              
              {multipleLocations ? (
                // Multiple locations table headers
                locationNames.map((name, index) => (
                  <th key={index} style={{ 
                    border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '4px 4px',
                    textAlign: 'center',
                    fontWeight: '500',
                    color: darkMode ? '#e2e8f0' : '#1a202c',
                    ...(audioMode ? { borderWidth: '2px', fontSize: '10px' } : {})
                  }}>
                    {/* Truncate long location names in 8-bit mode */}
                    {audioMode && name.length > 8 ? `${name.substring(0, 7)}…` : name}
                  </th>
                ))
              ) : (
                // Single location header
                <th style={{ 
                  border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                  padding: '4px 4px',
                  textAlign: 'center',
                  fontWeight: '500',
                  color: darkMode ? '#e2e8f0' : '#1a202c',
                  ...(audioMode ? { borderWidth: '2px', fontSize: '10px' } : {})
                }}>
                  Volunteers
                </th>
              )}
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
                  color: darkMode ? '#e2e8f0' : '#1a202c',
                  ...(audioMode ? { borderWidth: '2px', fontSize: audioMode ? '7px' : '10px' } : {})
                }}>
                  {/* Use smaller font size in 8-bit mode if needed */}
                  {slot.compactDisplay}
                </td>
                
                {multipleLocations ? (
                  // Multiple locations cells
                  slot.locations.map((location, locIndex) => (
                    <td key={locIndex} style={{ 
                      border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                      padding: '4px 2px',
                      textAlign: 'center',
                      ...(audioMode ? { borderWidth: '2px' } : {})
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        {location.volunteers.map((volunteerId, vIndex) => {
                          // Get the volunteer name
                          const displayName = volunteerMap[volunteerId] || volunteerId;
                          // For 8-bit mode, truncate long names
                          const truncatedName = audioMode && displayName.length > 6 
                            ? `${displayName.substring(0, 5)}…` 
                            : displayName;
                          
                          return (
                            <div 
                              key={vIndex}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '45%',
                                height: '22px',
                                backgroundColor: colors[volunteerId]?.bg || 'transparent',
                                color: colors[volunteerId]?.text || 'inherit',
                                borderRadius: audioMode ? '0px' : '2px',
                                fontSize: audioMode ? '8px' : '11px',
                                margin: '0 2px',
                                ...(audioMode ? { border: '2px solid #000' } : {})
                              }}
                            >
                              {truncatedName}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  ))
                ) : (
                  // Single location cell
                  <td style={{ 
                    border: darkMode ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '4px 2px',
                    textAlign: 'center',
                    ...(audioMode ? { borderWidth: '2px' } : {})
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      {slot.volunteers.map((volunteerId, vIndex) => {
                        // Get the volunteer name
                        const displayName = volunteerMap[volunteerId] || volunteerId;
                        // For 8-bit mode, truncate long names
                        const truncatedName = audioMode && displayName.length > 6 
                          ? `${displayName.substring(0, 5)}…` 
                          : displayName;
                        
                        return (
                          <div 
                            key={vIndex}
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '45%',
                              height: '22px',
                              backgroundColor: colors[volunteerId]?.bg || 'transparent',
                              color: colors[volunteerId]?.text || 'inherit',
                              borderRadius: audioMode ? '0px' : '2px',
                              fontSize: audioMode ? '8px' : '11px',
                              margin: '0 2px',
                              ...(audioMode ? { border: '2px solid #000' } : {})
                            }}
                          >
                            {truncatedName}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Legend using flex for vertical alignment */}
        <div style={{ fontSize: audioMode ? '8px' : '11px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {Object.keys(shiftCounts).map((volunteerId, index) => {
              const displayName = volunteerMap[volunteerId] || volunteerId;
              // For 8-bit mode, truncate long names
              const truncatedName = audioMode && displayName.length > 6 
                ? `${displayName.substring(0, 5)}…` 
                : displayName;
              
              return (
                <div 
                  key={index}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '18px',
                    backgroundColor: colors[volunteerId]?.bg || 'transparent',
                    color: colors[volunteerId]?.text || 'inherit',
                    borderRadius: audioMode ? '0px' : '2px',
                    fontSize: audioMode ? '8px' : '11px',
                    padding: '0 4px',
                    margin: '0 2px',
                    ...(audioMode ? { border: '2px solid #000' } : {})
                  }}
                >
                  {truncatedName}:{shiftCounts[volunteerId]}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Scriptural Point (only in SMPW mode) */}
        {smpwMode && scripturalPoint && (
          <div className={`mt-4 p-3 rounded-md ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} ${audioMode ? 'eight-bit-box' : ''}`}>
            <div className={`text-sm font-semibold mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'} ${audioMode ? 'eight-bit-text' : ''}`}>
              Scriptural Discussion
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} ${audioMode ? 'eight-bit-text' : ''}`}>
              {scripturalPoint}
            </div>
          </div>
        )}
      </div>
      
      {/* Share button with status indication */}
      <div className="flex justify-center mt-4 mb-2">
        <button
          onClick={copyScheduleToClipboard}
          disabled={copyStatus === 'copying'}
          className={`flex items-center justify-center py-2 px-5 ${audioMode ? 'eight-bit-button' : 'rounded-lg'} font-medium copy-btn ${
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
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${audioMode ? 'eight-bit-text' : ''}`}>
          Share this schedule via message or save to your device
        </p>
      </div>
    </div>
    
    {/* Save Instructions Modal */}
    {showSaveInstructions && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 ${audioMode ? 'eight-bit-panel' : 'rounded-lg'} shadow-lg max-w-sm mx-auto w-full`}>
          <h3 className={`text-lg font-bold mb-2 flex items-center ${audioMode ? 'eight-bit-heading' : ''}`}>
            <Smartphone className="mr-2" size={20} />
            Instructions
          </h3>
          <div className="mb-4">
            <p className={`mb-2 text-sm ${audioMode ? 'eight-bit-text' : ''}`}>How to share:</p>
            <ol className={`list-decimal pl-5 text-sm space-y-1 ${darkMode ? 'text-gray-300' : ''} ${audioMode ? 'eight-bit-text' : ''}`}>
              <li>Select "Share Schedule" to share directly using your phone's text messaging app.</li>
              <li>If you're not ready to share this, click the download icon at the top to save a picture of the schedule to your phone.</li>
            </ol>
          </div>
          <button 
            onClick={() => setShowSaveInstructions(false)}
            className={`w-full py-2 bg-indigo-600 text-white ${audioMode ? 'eight-bit-button' : 'rounded-md'}`}
          >
            Got it
          </button>
        </div>
      </div>
    )}
    
    {/* Copy Fallback Instructions */}
    {showCopyFallback && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 ${audioMode ? 'eight-bit-panel' : 'rounded-lg'} shadow-lg max-w-sm mx-auto w-full`}>
          <h3 className={`text-lg font-bold mb-2 flex items-center ${audioMode ? 'eight-bit-heading' : ''}`}>
            <Copy className="mr-2" size={20} />
            Copy Schedule
          </h3>
          <div className="mb-4">
            <p className={`mb-2 text-sm ${audioMode ? 'eight-bit-text' : ''}`}>Your device doesn't support direct clipboard copying of images. You can:</p>
            <ol className={`list-decimal pl-5 text-sm space-y-1 ${darkMode ? 'text-gray-300' : ''} ${audioMode ? 'eight-bit-text' : ''}`}>
              <li>Take a screenshot of this screen</li>
              <li>Download the image using the download button</li>
              <li>Use the screenshot to share via messages</li>
            </ol>
          </div>
          <button 
            onClick={() => setShowCopyFallback(false)}
            className={`w-full py-2 bg-indigo-600 text-white ${audioMode ? 'eight-bit-button' : 'rounded-md'}`}
          >
            Got it
          </button>
        </div>
      </div>
    )}
    
    {/* iOS-specific Instructions Modal */}
    {showIOSInstructions && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-4 ${audioMode ? 'eight-bit-panel' : 'rounded-lg'} shadow-lg max-w-sm mx-auto w-full`}>
          <h3 className={`text-lg font-bold mb-2 flex items-center ${audioMode ? 'eight-bit-heading' : ''}`}>
            <Smartphone className="mr-2" size={20} />
            iPhone Instructions
          </h3>
          <div className="mb-4">
            <p className={`mb-2 text-sm ${audioMode ? 'eight-bit-text' : ''}`}>To share this schedule from your iPhone:</p>
            <ol className={`list-decimal pl-5 text-sm space-y-2 ${darkMode ? 'text-gray-300' : ''} ${audioMode ? 'eight-bit-text' : ''}`}>
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
              className={`flex-1 py-2 bg-blue-600 text-white ${audioMode ? 'eight-bit-button' : 'rounded-md'} flex items-center justify-center`}
            >
              <Download size={16} className="mr-1" /> Download
            </button>
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className={`flex-1 py-2 bg-gray-600 text-white ${audioMode ? 'eight-bit-button' : 'rounded-md'}`}
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
<div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} ${audioMode ? 'eight-bit-container' : ''}`}>
  {/* Audio element for the Easter egg */}
  <audio ref={audioRef} src={`${process.env.PUBLIC_URL}/peopleofallsorts.mp3`} loop={audioMode && !audioMuted} />
  
  {/* SMPW Mode Activation Animation */}
  {showActivation && (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
      <div className={`bg-indigo-600 p-6 ${audioMode ? 'eight-bit-box' : 'rounded-lg'} shadow-xl transform scale-100 animate-pulse`}>
        <h2 className={`text-xl font-bold text-white ${audioMode ? 'eight-bit-text' : ''}`}>{activationMessage}</h2>
      </div>
    </div>
  )}
  
  {/* Mute button (appears only when audio is playing) */}
  {audioMode && (
    <button 
      onClick={() => {
        setAudioMuted(!audioMuted);
        if (audioRef.current) {
          if (audioMuted) {
            audioRef.current.play().catch(e => console.error('Audio playback failed:', e));
          } else {
            audioRef.current.pause();
          }
        }
      }}
      className={`fixed bottom-4 right-4 p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} ${audioMode ? 'eight-bit-button' : 'rounded-full'} shadow-lg z-50`}
      aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
    >
      {audioMuted ? <VolumeX size={20} className={darkMode ? 'text-white' : 'text-gray-800'} /> : <Volume2 size={20} className={darkMode ? 'text-white' : 'text-gray-800'} />}
    </button>
  )}
  
  {/* Header with mobile improvements */}
  <header className={`bg-gradient-to-r ${darkMode ? 'from-indigo-900 to-purple-900' : 'from-indigo-600 to-purple-600'} py-4 px-4 text-white ${audioMode ? 'eight-bit-header' : ''}`}>
  <div className="max-w-6xl mx-auto">
    <div className="flex flex-col sm:flex-row items-center justify-between">
      <h1 
        className={`text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-0 flex items-center cursor-pointer ${audioMode ? 'eight-bit-text' : ''}`}
        onClick={handleTitleClick}
      >
        <Calendar className="mr-2 hidden sm:inline" />
        <span>{smpwMode ? (audioMode ? "8-BIT SMPW" : "SMPW Scheduler") : (audioMode ? "8-BIT SCHEDULER" : "Volunteer Schedule Builder")}</span>
      </h1>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={toggleDarkMode}
          className={`p-2 ${audioMode ? 'eight-bit-button' : 'rounded-full'} bg-white bg-opacity-10 hover:bg-opacity-20 text-white flex items-center`}
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
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 ${audioMode ? 'eight-bit-panel' : 'rounded-lg'} shadow`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4 flex items-center ${audioMode ? 'eight-bit-heading' : ''}`}>
          <Users className={`mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={20} />
          Setup
        </h2>
        
        <div className="space-y-5">
          {/* Location Name */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 ${audioMode ? 'eight-bit-text' : ''}`}>
              <Building className="inline-block mr-1 mb-0.5" size={16} />
              Location Name (Optional)
            </label>
            {smpwMode ? (
              <select
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
              >
                <option value="">Select location (optional)</option>
                {smpwLocations.map((location, index) => (
                  <option key={index} value={location}>{location}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter location name"
                className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
              />
            )}
          </div>
          
          {/* Multiple Locations Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="multipleLocations"
              checked={multipleLocations}
              onChange={handleMultipleLocationsChange}
              className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${audioMode ? 'eight-bit-checkbox' : 'rounded'}`}
            />
            <label
              htmlFor="multipleLocations"
              className={`ml-2 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${audioMode ? 'eight-bit-text' : ''}`}
            >
              {smpwMode ? "Eastern Market Mode" : "Multiple Locations"}
            </label>
            <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${audioMode ? 'eight-bit-text' : ''}`}>
              {smpwMode ? 
                "(Auto-configures Fisher/Russell and Market/Winder)" : 
                "(e.g. Two cart locations w/ one keyman)"}
            </span>
          </div>
          
          {/* Location Names when Multiple Locations is checked */}
          {multipleLocations && !smpwMode && (
            <div className="space-y-3 pl-6 border-l-2 border-indigo-200 dark:border-indigo-800">
              {locationNames.map((name, index) => (
                <div key={index}>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                    Location {index + 1} Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleLocationNameChange(index, e.target.value)}
                    placeholder={`Location ${index + 1}`}
                    className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Date Toggle and Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${audioMode ? 'eight-bit-text' : ''}`}>
                <Calendar className="inline-block mr-1 mb-0.5" size={16} />
                Include Date
              </label>
              <button
                onClick={toggleDateEnabled}
                className={`flex items-center text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-600'} ${audioMode ? 'eight-bit-text' : ''}`}
              >
                {dateEnabled ? (
                  <>
                    <ToggleRight size={20} className="mr-1" />
                    <span>On</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft size={20} className="mr-1" />
                    <span>Off</span>
                  </>
                )}
              </button>
            </div>
            
            {dateEnabled && (
              <input
                type="date"
                value={timeRange.date}
                onChange={(e) => handleTimeChange('date', e.target.value)}
                className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
              />
            )}
          </div>
          
          {/* Time Range - Improved for mobile */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 ${audioMode ? 'eight-bit-text' : ''}`}>
              <Clock className="inline-block mr-1 mb-0.5" size={16} />
              Shift Time
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="w-full">
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={timeRange.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                />
              </div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center sm:mx-2 ${audioMode ? 'eight-bit-text' : ''}`}>to</span>
              <div className="w-full">
                <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                  End Time
                </label>
                <input
                  type="time"
                  value={timeRange.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                />
              </div>
            </div>
          </div>
          
          {/* Shift Interval */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 ${audioMode ? 'eight-bit-text' : ''}`}>
              <Clock className="inline-block mr-1 mb-0.5" size={16} />
              How long should each shift be?
            </label>
            <div className="relative">
              <select
                value={timeRange.isCustomInterval ? 'custom' : timeRange.interval}
                onChange={(e) => handleTimeChange('interval', e.target.value)}
                className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded appearance-none'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
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
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                  Custom shift length (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={timeRange.customInterval}
                  onChange={(e) => handleTimeChange('customInterval', e.target.value)}
                  className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                />
              </div>
            )}
          </div>
          
          {/* Scriptural Point (SMPW Mode only) */}
          {smpwMode && (
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 ${audioMode ? 'eight-bit-text' : ''}`}>
                <Info className="inline-block mr-1 mb-0.5" size={16} />
                Share your Scriptural Point (Optional)
              </label>
              <textarea
                value={scripturalPoint}
                onChange={(e) => setScripturalPoint(e.target.value)}
                placeholder="Enter a scriptural discussion point..."
                rows="3"
                className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
              />
            </div>
          )}
          
          {/* Volunteers - Improved spacing for mobile with delete buttons */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 ${audioMode ? 'eight-bit-text' : ''}`}>
              <Users className="inline-block mr-1 mb-0.5" size={16} />
              Volunteers {multipleLocations && <span className="text-xs font-normal ml-1">
                (min 4 required for multiple locations)
              </span>}
            </label>
            <div className="space-y-2">
              {volunteers.map((volunteer, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={volunteer}
                    onChange={(e) => handleVolunteerChange(index, e.target.value)}
                    placeholder={`Volunteer ${index + 1}`}
                    className={`flex-1 p-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'} ${audioMode ? 'eight-bit-button' : 'rounded'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                  />
                  <button
                    onClick={() => deleteVolunteer(index)}
                    disabled={volunteers.length <= 2} // Prevent deletion if only 2 volunteers
                    className={`p-2 ${audioMode ? 'eight-bit-button' : 'rounded'} ${
                      volunteers.length <= 2
                        ? (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400')
                        : (darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-500 hover:bg-red-200')
                    }`}
                    aria-label="Delete volunteer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addVolunteer}
              className={`mt-3 inline-flex items-center px-3 py-2 text-sm font-medium ${
                darkMode 
                  ? 'text-indigo-300 bg-indigo-900 hover:bg-indigo-800' 
                  : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
              } ${audioMode ? 'eight-bit-button' : 'rounded'}`}
            >
              <Plus size={16} className="mr-1" />
              Add Volunteer
            </button>
          </div>
          
          {/* Generate Button - Increased touch target for mobile */}
          <button
            onClick={generateSchedule}
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-indigo-600 text-white font-medium ${audioMode ? 'eight-bit-button' : 'rounded-md'} hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center text-base`}
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
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 sm:p-6 ${audioMode ? 'eight-bit-panel' : 'rounded-lg'} shadow`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center ${audioMode ? 'eight-bit-heading' : ''}`}>
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
              } ${audioMode ? 'eight-bit-button' : 'rounded'} mr-2`}
            >
              <Shuffle size={16} className="mr-1" />
              Shuffle
            </button>
          )}
        </div>
        
        {schedule.length > 0 ? (
          <>
            {conflicts.length > 0 && (
              <div className={`mb-4 p-3 ${darkMode ? 'bg-yellow-900 border-yellow-800 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800'} border ${audioMode ? 'eight-bit-box' : 'rounded-md'} text-sm flex items-start`}>
                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`font-medium ${audioMode ? 'eight-bit-text' : ''}`}>Warning: Schedule has conflicts</p>
                  <p className={audioMode ? 'eight-bit-text' : ''}>The highlighted cells indicate volunteers working back-to-back shifts.</p>
                </div>
              </div>
            )}
            
            {/* Volunteer Summary */}
            {schedule.length > 0 && (
              <div className={`mb-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${audioMode ? 'eight-bit-box' : 'rounded-md'}`}>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2 ${audioMode ? 'eight-bit-text' : ''}`}>Volunteer Shifts</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(schedule[0].shiftCounts || {}).map(([volunteerId, count], index) => (
                    <div 
                      key={index}
                      className={`px-2 py-1 ${audioMode ? 'eight-bit-box' : 'rounded'} text-sm inline-flex items-center justify-center`}
                      style={{ 
                        backgroundColor: colors[volunteerId]?.bg || 'transparent',
                        color: colors[volunteerId]?.text || 'inherit',
                        ...(audioMode ? { border: '2px solid #000' } : {})
                      }}
                    >
                      {volunteerMap[volunteerId] || volunteerId}: {count}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Schedule Table - Different display for multiple locations */}
            {multipleLocations ? (
              // Multiple locations schedule table
              <div className={`overflow-x-auto overflow-y-auto max-h-80 sm:max-h-96 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${audioMode ? 'eight-bit-box' : 'rounded-md'}`}>
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                    <tr>
                      <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider ${audioMode ? 'eight-bit-text' : ''}`}>
                        Time
                      </th>
                      {locationNames.map((name, locIndex) => (
                        <th 
                          key={locIndex} 
                          colSpan={2}
                          className={`px-2 sm:px-3 py-2 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider ${audioMode ? 'eight-bit-text' : ''}`}
                        >
                          {/* Truncate long location names in 8-bit mode */}
                          {audioMode && name.length > 8 ? `${name.substring(0, 7)}…` : name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {schedule.map((slot, slotIndex) => (
                      <tr key={slotIndex} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className={`px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'} ${audioMode ? 'eight-bit-text' : ''}`}>
                          {slot.display12}
                        </td>
                        
                        {slot.locations.map((location, locIndex) => (
                          // For each location, render 2 volunteer columns
                          <React.Fragment key={locIndex}>
                            {[0, 1].map(volIndex => {
                              const volunteerId = location.volunteers[volIndex];
                              const displayName = volunteerMap[volunteerId] || '';
                              const hasConflict = conflicts.some(c => 
                                c.slotIndex === slotIndex && 
                                c.locationIndex === locIndex && 
                                c.volunteer === volunteerId
                              );
                              const hasDuplicateError = duplicateError && 
                                duplicateError.slotIndex === slotIndex && 
                                duplicateError.locationIndex === locIndex;
                              
                              return (
                                <td key={volIndex} className="px-1 sm:px-2 py-2 whitespace-nowrap text-xs sm:text-sm">
                                  <div className={`${audioMode ? '' : 'rounded'} ${hasConflict ? (darkMode ? 'bg-red-900' : 'bg-red-50') : ''} ${hasDuplicateError ? (darkMode ? 'border border-red-700' : 'border border-red-300') : ''}`}>
                                    <select
                                      value={volunteerId || ''}
                                      onChange={(e) => updateScheduleVolunteer(slotIndex, volIndex, e.target.value, locIndex)}
                                      className={`w-full py-1 px-2 ${audioMode ? 'eight-bit-button' : 'rounded border-0'} focus:ring-0 text-xs sm:text-sm ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                                      style={{
                                        backgroundColor: volunteerId ? colors[volunteerId]?.bg : (darkMode ? '#1F2937' : 'transparent'),
                                        color: volunteerId ? colors[volunteerId]?.text : 'inherit'
                                      }}
                                    >
                                      <option value="" className={darkMode ? 'bg-gray-700' : ''}>Select volunteer</option>
                                      {Object.keys(volunteerMap).map((id) => (
                                        <option key={id} value={id} className={darkMode ? 'bg-gray-700' : ''}>
                                          {volunteerMap[id]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  {hasConflict && (
                                    <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mt-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                                      Back-to-back shift
                                    </div>
                                  )}
                                  
                                  {hasDuplicateError && volIndex === 0 && (
                                    <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mt-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                                      {duplicateError.message}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Original single location schedule table
              <div className={`overflow-x-auto overflow-y-auto max-h-80 sm:max-h-96 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${audioMode ? 'eight-bit-box' : 'rounded-md'}`}>
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0`}>
                    <tr>
                      <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider ${audioMode ? 'eight-bit-text' : ''}`}>
                        Time
                      </th>
                      <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider ${audioMode ? 'eight-bit-text' : ''}`}>
                        Vol 1
                      </th>
                      <th className={`px-2 sm:px-3 py-2 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider ${audioMode ? 'eight-bit-text' : ''}`}>
                        Vol 2
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {schedule.map((slot, slotIndex) => (
                      <tr key={slotIndex} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className={`px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'} ${audioMode ? 'eight-bit-text' : ''}`}>
                          {slot.display12}
                        </td>
                        {[0, 1].map(volIndex => {
                          const volunteerId = slot.volunteers[volIndex];
                          const displayName = volunteerMap[volunteerId] || '';
                          const hasConflict = conflicts.some(c => 
                            c.slotIndex === slotIndex && c.volunteer === volunteerId
                          );
                          const hasDuplicateError = duplicateError && 
                                                    duplicateError.slotIndex === slotIndex;
                          
                          return (
                            <td key={volIndex} className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm">
                              <div className={`${audioMode ? '' : 'rounded'} ${hasConflict ? (darkMode ? 'bg-red-900' : 'bg-red-50') : ''} ${hasDuplicateError ? (darkMode ? 'border border-red-700' : 'border border-red-300') : ''}`}>
                                <select
                                  value={volunteerId || ''}
                                  onChange={(e) => updateScheduleVolunteer(slotIndex, volIndex, e.target.value)}
                                  className={`w-full py-1 px-2 ${audioMode ? 'eight-bit-button' : 'rounded border-0'} focus:ring-0 text-xs sm:text-sm ${darkMode ? 'bg-gray-700 text-white' : ''}`}
                                  style={{
                                    backgroundColor: volunteerId ? colors[volunteerId]?.bg : (darkMode ? '#1F2937' : 'transparent'),
                                    color: volunteerId ? colors[volunteerId]?.text : 'inherit'
                                  }}
                                >
                                  <option value="" className={darkMode ? 'bg-gray-700' : ''}>Select volunteer</option>
                                  {Object.keys(volunteerMap).map((id) => (
                                    <option key={id} value={id} className={darkMode ? 'bg-gray-700' : ''}>
                                      {volunteerMap[id]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              {hasConflict && (
                                <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mt-1 ${audioMode ? 'eight-bit-text' : ''}`}>
                                  Back-to-back shift
                                </div>
                              )}
                              
                              {hasDuplicateError && volIndex === 0 && (
                                <div className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'} mt-1 ${audioMode ? 'eight-bit-text' : ''}`}>
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
            )}
            {/* Finished Button - Larger for better mobile touch target */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={enterScreenshotMode}
                className={`inline-flex items-center px-5 py-2 text-base font-medium text-white bg-green-600 ${audioMode ? 'eight-bit-button' : 'rounded'} hover:bg-green-700`}
              >
                <Camera size={18} className="mr-2" />
                Finished
              </button>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center h-52 md:h-64 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar size={48} className="mb-4 opacity-30" />
            <p className={audioMode ? 'eight-bit-text' : ''}>No schedule generated yet</p>
            <p className={`text-sm ${audioMode ? 'eight-bit-text' : ''}`}>Fill in the setup form and click Generate</p>
          </div>
        )}
      </div>
    </div>
  </main>
  
  <footer className={`mt-8 pt-8 pb-12 border-t ${darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500'} ${audioMode ? 'eight-bit-footer' : ''}`}>
  <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
    {audioMode && (
      <div className="mb-8 mt-4">
        <img 
          src={`${process.env.PUBLIC_URL}/${
            showFellAnimation ? 'fell.gif' : 
            showLowHpAnimation ? 'lowhp.gif' : 
            showPokeAnimation ? 'poking_brandon.gif' : 
            'wave.gif'
          }`} 
          alt="8-bit animation" 
          className="h-64 sm:h-96 md:h-160 lg:h-200 w-auto max-w-full cursor-pointer"
          style={{ imageRendering: 'pixelated' }}
          onClick={handleWaveClick}
        />
      </div>
    )}
    <div className="flex flex-col sm:flex-row justify-between items-center text-center text-xs w-full mt-6">
      <div className={audioMode ? 'eight-bit-text' : ''}>v 1.5.0 {audioMode && "8-BIT MODE"}</div>
      <div className={`mt-1 sm:mt-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'} ${audioMode ? 'eight-bit-text' : ''}`}>
        {schedulesGenerated.toLocaleString()} schedules made with this tool
      </div>
    </div>
  </div>
</footer>

</div>
);
};

export default ScheduleBuilder;