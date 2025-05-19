// src/utils/scheduleUtils.js

// --- Constants ---
// 8-bit color palette (NES inspired) - Moved here for reuse
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

// Standard palettes (light/dark) - Moved here
const standardPaletteLight = [
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
const standardPaletteDark = [
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
];


// --- Helper Functions ---

// Fisher-Yates shuffle algorithm
export const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Check if a volunteer is assigned in the previous slot (any location if multiple)
export const isVolunteerAvailable = (volunteerId, slotIndex, assignedVolunteers, isMultipleLocations) => {
    if (slotIndex <= 0 || !assignedVolunteers || assignedVolunteers.length <= slotIndex - 1) return true; // First slot or invalid data

    const previousSlotAssignments = assignedVolunteers[slotIndex - 1]; // This is assignments for the *previous* time slot

    if (!previousSlotAssignments) return true; // Should not happen, but safe check

    if (isMultipleLocations) {
        // `previousSlotAssignments` should be an array of arrays like [[v1, v2], [v3, v4]]
        if (!Array.isArray(previousSlotAssignments) || !Array.isArray(previousSlotAssignments[0])) {
            console.warn("isVolunteerAvailable: Expected nested array for multi-location previous slot.");
            return true; // Fail safe
        }
        return !previousSlotAssignments.some(locationVols => locationVols.includes(volunteerId));
    } else {
        // `previousSlotAssignments` should be a flat array like [v1, v2]
        if (!Array.isArray(previousSlotAssignments)) {
             console.warn("isVolunteerAvailable: Expected flat array for single-location previous slot.");
             return true; // Fail safe
        }
        return !previousSlotAssignments.includes(volunteerId);
    }
};

// Check if a volunteer is assigned anywhere in the *current* slot (across all locations if multiple)
export const isVolunteerInCurrentSlot = (volunteerId, currentSlotAssignments, isMultipleLocations) => {
     if (!currentSlotAssignments) return false;

     if (isMultipleLocations) {
        // `currentSlotAssignments` should be array of arrays like [[v1, v2], [v3, v4]]
         if (!Array.isArray(currentSlotAssignments) || !Array.isArray(currentSlotAssignments[0])) {
             console.warn("isVolunteerInCurrentSlot: Expected nested array for multi-location current slot.");
             return false;
         }
         return currentSlotAssignments.some(locationVols => locationVols.includes(volunteerId));
     } else {
         // `currentSlotAssignments` should be flat array like [v1, v2]
          if (!Array.isArray(currentSlotAssignments)) {
              console.warn("isVolunteerInCurrentSlot: Expected flat array for single-location current slot.");
              return false;
          }
         return currentSlotAssignments.includes(volunteerId);
     }
};


// --- Core Logic Functions ---

// Convert 24h time to 12h format
export const formatTo12Hour = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return ''; // Basic validation
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
};

// Format date string (YYYY-MM-DD)
export const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
         // Create date in UTC to avoid timezone shifts when only date is relevant
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toLocaleDateString('en-US', {
            timeZone: 'UTC', // Ensure consistency regardless of browser timezone
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", dateStr, e);
        return ''; // Return empty string on error
    }
};

// Generate colors for volunteer IDs
export const generateColorsForIds = (volunteerIds, use8BitPalette = false, isDarkMode = false) => {
    const colorMap = {};
    const standardPalette = isDarkMode ? standardPaletteDark : standardPaletteLight;
    const paletteToUse = use8BitPalette ? eightBitPalette : standardPalette;

    if (!Array.isArray(volunteerIds)) {
        console.error("generateColorsForIds expects an array of volunteer IDs");
        return {};
    }

    volunteerIds.forEach((id, index) => {
        if (id) { // Ensure id is not null/undefined
             colorMap[id] = paletteToUse[index % paletteToUse.length];
        }
    });

    return colorMap;
};

// Generate time slots
export const generateTimeSlots = (startTime, endTime, interval, formatFn, isMultipleLocations, locationNames = []) => {
    const slots = [];
    if (!startTime || !endTime || !interval || interval <= 0) {
        console.error("Invalid time slot parameters");
        return slots; // Return empty if inputs are bad
    }

    try {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let currentHour = startHour;
        let currentMinute = startMinute;

        // Handle potential overnight schedules or invalid end times relative to start
        const totalStartMinutes = startHour * 60 + startMinute;
        let totalEndMinutes = endHour * 60 + endMinute;

        // If end time is earlier than start time, assume it's the next day
        if (totalEndMinutes <= totalStartMinutes) {
             totalEndMinutes += 24 * 60; // Add a day's worth of minutes
        }

        let totalCurrentMinutes = totalStartMinutes;

        while (totalCurrentMinutes < totalEndMinutes) {
            const currentSlotStartHour = Math.floor(totalCurrentMinutes / 60) % 24;
            const currentSlotStartMinute = totalCurrentMinutes % 60;
            const timeString = `${currentSlotStartHour.toString().padStart(2, '0')}:${currentSlotStartMinute.toString().padStart(2, '0')}`;

            let totalNextMinutes = totalCurrentMinutes + interval;

             // Stop if the next slot would start exactly at or after the end time
            if (totalNextMinutes > totalEndMinutes) {
                 break;
            }

            const nextSlotStartHour = Math.floor(totalNextMinutes / 60) % 24;
            const nextSlotStartMinute = totalNextMinutes % 60;
            const endTimeString = `${nextSlotStartHour.toString().padStart(2, '0')}:${nextSlotStartMinute.toString().padStart(2, '0')}`;

            slots.push({
                startTime: timeString,
                endTime: endTimeString,
                display12: `${formatFn(timeString)} - ${formatFn(endTimeString)}`,
                compactDisplay: `${formatFn(timeString)}-${formatFn(endTimeString)}`,
                // Initialize structures based on location mode
                volunteers: isMultipleLocations ? [] : ['',''], // Empty for multi, placeholders for single
                locations: isMultipleLocations
                    ? locationNames.map(name => ({ name, volunteers: ['',''] })) // Placeholders for multi
                    : [], // Empty for single
                shiftCounts: {}, // Will be populated later
            });

            totalCurrentMinutes = totalNextMinutes;
        }
    } catch (e) {
        console.error("Error generating time slots:", e);
        return []; // Return empty on error
    }

    return slots;
};


// --- Schedule Creation Logic ---

// Create schedule for multiple locations
const createMultiLocationSchedule = (internalVolunteerIds, slots, locationNames, randomize) => {
    const numLocations = locationNames.length;
    const numSlots = slots.length;

    // Initialize tracking structures
    const pairCounts = {}; // Track pairings for variety: "v1-v2": count
    internalVolunteerIds.forEach(v1 => {
        internalVolunteerIds.forEach(v2 => { if (v1 < v2) pairCounts[`${v1}-${v2}`] = 0; });
    });
    const shiftCounts = {}; // Track shifts per volunteer: "v1": count
    internalVolunteerIds.forEach(v => shiftCounts[v] = 0);

    // assignments[slotIndex][locationIndex] = [volunteerId1, volunteerId2]
    const assignments = Array(numSlots).fill(null).map(() =>
        Array(numLocations).fill(null).map(() => []) // Initialize with empty arrays
    );

    // --- PASS 1: Assign pairs respecting back-to-back and optimizing variety/workload ---
    for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
        for (let locationIndex = 0; locationIndex < numLocations; locationIndex++) {
            // Find volunteers *available* for this specific slot & location
            let candidates = internalVolunteerIds.filter(vId =>
                isVolunteerAvailable(vId, slotIndex, assignments, true) && // Not in previous slot
                !isVolunteerInCurrentSlot(vId, assignments[slotIndex], true) // Not already in this current slot (another location)
            );

            if (candidates.length < 2) continue; // Not enough available, handle later

            // Sort candidates: Primary: lowest shift count, Secondary: random (if enabled) or stable
            candidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
            if (randomize) {
                // Shuffle candidates with the same lowest shift count
                const minShifts = shiftCounts[candidates[0]];
                let firstDifferentShiftIndex = candidates.findIndex(c => shiftCounts[c] > minShifts);
                if (firstDifferentShiftIndex === -1) firstDifferentShiftIndex = candidates.length; // All have same count
                const lowestShiftGroup = candidates.slice(0, firstDifferentShiftIndex);
                const shuffledLowest = shuffleArray(lowestShiftGroup);
                candidates = [...shuffledLowest, ...candidates.slice(firstDifferentShiftIndex)];
            }

            const firstVolunteer = candidates[0];

            // Find the best partner for the first volunteer among remaining candidates
            let bestPartner = null;
            let lowestPairScore = Infinity; // Lower is better (fewer previous pairings)

            for (let i = 1; i < candidates.length; i++) {
                const potentialPartner = candidates[i];
                const pairKey = [firstVolunteer, potentialPartner].sort().join('-'); // Consistent key order
                const currentPairCount = pairCounts[pairKey] || 0;

                 // Score: primarily pair count, secondarily partner's shift count
                const score = currentPairCount * 100 + shiftCounts[potentialPartner];

                if (score < lowestPairScore) {
                    lowestPairScore = score;
                    bestPartner = potentialPartner;
                }
            }

            // Assign if a partner was found
            if (bestPartner) {
                assignments[slotIndex][locationIndex] = [firstVolunteer, bestPartner];
                shiftCounts[firstVolunteer]++;
                shiftCounts[bestPartner]++;
                const pairKey = [firstVolunteer, bestPartner].sort().join('-');
                pairCounts[pairKey]++;
            } else if (candidates.length >= 1) {
                // Edge case: Couldn't find a partner but had one candidate, assign just one for now
                assignments[slotIndex][locationIndex] = [firstVolunteer];
                 shiftCounts[firstVolunteer]++;
            }
        }
    }

    // --- PASS 2: Fill remaining spots, relaxing constraints slightly ---
     for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
         for (let locationIndex = 0; locationIndex < numLocations; locationIndex++) {
             const currentAssignment = assignments[slotIndex][locationIndex];
             const needed = 2 - currentAssignment.length;

             if (needed > 0) {
                 let candidates = internalVolunteerIds.filter(vId =>
                     !isVolunteerInCurrentSlot(vId, assignments[slotIndex], true) && // Not already in this slot
                     !currentAssignment.includes(vId) // Not already assigned to this specific location/shift
                 );

                 // Prioritize those not in the previous slot if possible
                 const preferredCandidates = candidates.filter(vId => isVolunteerAvailable(vId, slotIndex, assignments, true));

                 // Sort by shift count
                 preferredCandidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
                 candidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);


                 for (let i = 0; i < needed; i++) {
                     // Try preferred first, then any candidate
                     const volunteerToAdd = preferredCandidates.shift() || candidates.shift();
                     if (volunteerToAdd) {
                         assignments[slotIndex][locationIndex].push(volunteerToAdd);
                         shiftCounts[volunteerToAdd]++;
                         // Update pair count if we just completed a pair
                         if (assignments[slotIndex][locationIndex].length === 2) {
                             const pairKey = assignments[slotIndex][locationIndex].sort().join('-');
                             pairCounts[pairKey]++;
                         }
                     } else {
                         // Very rare: No candidates left at all, leave spot empty
                         console.warn(`Could not fill spot ${i+1} for Slot ${slotIndex}, Loc ${locationIndex}`);
                         assignments[slotIndex][locationIndex].push(null); // Use null placeholder
                     }
                 }
             }
         }
     }


    return { assignments, shiftCounts };
};


// Create schedule for single location
const createSingleLocationSchedule = (internalVolunteerIds, slots, randomize) => {
     const numSlots = slots.length;

    // Initialize tracking structures
    const pairCounts = {}; // "v1-v2": count
    internalVolunteerIds.forEach(v1 => {
        internalVolunteerIds.forEach(v2 => { if (v1 < v2) pairCounts[`${v1}-${v2}`] = 0; });
    });
    const shiftCounts = {}; // "v1": count
    internalVolunteerIds.forEach(v => shiftCounts[v] = 0);

     // assignments[slotIndex] = [volunteerId1, volunteerId2]
    const assignments = Array(numSlots).fill(null).map(() => []); // Initialize with empty arrays

     // --- PASS 1: Assign pairs respecting back-to-back and optimizing ---
     for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
         let candidates = internalVolunteerIds.filter(vId =>
             isVolunteerAvailable(vId, slotIndex, assignments, false) // Not in previous slot
         );

         if (candidates.length < 2) continue;

         // Sort/Shuffle candidates
         candidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
         if (randomize) {
             const minShifts = shiftCounts[candidates[0]];
             let firstDifferentShiftIndex = candidates.findIndex(c => shiftCounts[c] > minShifts);
             if (firstDifferentShiftIndex === -1) firstDifferentShiftIndex = candidates.length;
             const lowestShiftGroup = candidates.slice(0, firstDifferentShiftIndex);
             const shuffledLowest = shuffleArray(lowestShiftGroup);
             candidates = [...shuffledLowest, ...candidates.slice(firstDifferentShiftIndex)];
         }

         const firstVolunteer = candidates[0];

         // Find best partner
         let bestPartner = null;
         let lowestPairScore = Infinity;
         for (let i = 1; i < candidates.length; i++) {
             const potentialPartner = candidates[i];
             const pairKey = [firstVolunteer, potentialPartner].sort().join('-');
             const currentPairCount = pairCounts[pairKey] || 0;
             const score = currentPairCount * 100 + shiftCounts[potentialPartner];
             if (score < lowestPairScore) {
                 lowestPairScore = score;
                 bestPartner = potentialPartner;
             }
         }

         // Assign
         if (bestPartner) {
             assignments[slotIndex] = [firstVolunteer, bestPartner];
             shiftCounts[firstVolunteer]++;
             shiftCounts[bestPartner]++;
             const pairKey = [firstVolunteer, bestPartner].sort().join('-');
             pairCounts[pairKey]++;
         } else if (candidates.length >= 1) {
              assignments[slotIndex] = [firstVolunteer]; // Assign just one for now
              shiftCounts[firstVolunteer]++;
         }
     }

     // --- PASS 2: Fill remaining spots ---
     for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
         const currentAssignment = assignments[slotIndex];
         const needed = 2 - currentAssignment.length;

         if (needed > 0) {
             let candidates = internalVolunteerIds.filter(vId =>
                 !currentAssignment.includes(vId) // Not already assigned to this shift
             );

             // Prioritize those available (not in previous shift)
             const preferredCandidates = candidates.filter(vId => isVolunteerAvailable(vId, slotIndex, assignments, false));

             preferredCandidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);
             candidates.sort((a, b) => shiftCounts[a] - shiftCounts[b]);

             for (let i = 0; i < needed; i++) {
                 const volunteerToAdd = preferredCandidates.shift() || candidates.shift();
                 if (volunteerToAdd) {
                     assignments[slotIndex].push(volunteerToAdd);
                     shiftCounts[volunteerToAdd]++;
                      if (assignments[slotIndex].length === 2) {
                          const pairKey = assignments[slotIndex].sort().join('-');
                          pairCounts[pairKey]++;
                      }
                 } else {
                      console.warn(`Could not fill spot ${i+1} for Slot ${slotIndex}`);
                      assignments[slotIndex].push(null); // Placeholder
                 }
             }
         }
     }

    return { assignments, shiftCounts };
};


// Main exported function to create schedule
export const createSchedule = (internalVolunteerIds, slots, randomize = false, isMultipleLocations = false, locationNames = []) => {
    if (!internalVolunteerIds || internalVolunteerIds.length === 0 || !slots || slots.length === 0) {
        console.error("Cannot create schedule with empty volunteers or slots.");
        return { assignments: [], shiftCounts: {} };
    }

    if (isMultipleLocations) {
        if (!locationNames || locationNames.length === 0) {
             console.error("Location names required for multi-location schedule.");
             return { assignments: [], shiftCounts: {} };
        }
        return createMultiLocationSchedule(internalVolunteerIds, slots, locationNames, randomize);
    } else {
        return createSingleLocationSchedule(internalVolunteerIds, slots, randomize);
    }
};