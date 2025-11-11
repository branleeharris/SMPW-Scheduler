// src/utils/generateImage.js

// This function encapsulates the complex canvas drawing logic
export const generateScheduleImageBlob = async ({
    schedule, volunteerMap, colors, timeRange, locationName, locationNames,
    multipleLocations, dateEnabled, smpwMode, scripturalPoint,
    darkMode, audioMode, formatTo12Hour, formatDate
}) => {
    if (!schedule || schedule.length === 0 || !volunteerMap || Object.keys(volunteerMap).length === 0) {
        throw new Error("Missing data for image generation");
    }

    return new Promise(async (resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Failed to acquire 2D canvas context');

             // --- Configuration --- (Adjust as needed, mirroring ScreenshotPreview styling)
            const config = {
                padding: audioMode ? 15 : 20,
                headerHeight: 50,
                rowHeight: audioMode ? 28 : 30,
                timeColumnWidth: audioMode ? 80 : 90,
                // Calculate width needed per location pair, adjust padding between names
                volunteerCellWidth: audioMode ? 55 : 65, // Width for ONE volunteer name tag
                volunteerCellPadding: audioMode ? 4 : 6, // Padding around the tag
                locationHeaderPadding: audioMode ? 8: 10,
                get locationPairWidth() {
                    return (this.volunteerCellWidth * 2) + (this.volunteerCellPadding * 3) + (this.locationHeaderPadding * 2); // Width for a location column with 2 volunteers
                },
                 get singleLocationWidth() {
                     return (this.volunteerCellWidth * 2) + (this.volunteerCellPadding * 3); // Width for "Volunteers" column
                 },
                legendHeight: 35,
                scripturePadding: 15,
                scriptureHeaderHeight: 25,
                scriptureLineHeight: audioMode ? 12 : 16,
                cornerRadius: audioMode ? 0 : 4,
                borderColor: audioMode ? (darkMode ? '#CCCCCC' : '#000000') : (darkMode ? '#4a5568' : '#e2e8f0'),
                headerBgColor: audioMode ? (darkMode ? '#444444' : '#C0C0C0') : (darkMode ? '#2d3748' : '#f8fafc'), // Use Tailwind slate/gray
                altRowBgColor: audioMode ? (darkMode ? '#1A1A1A' : '#F0F0F0') : (darkMode ? '#1f2937' : '#f9fafb'), // Tailwind gray/slate
                mainRowBgColor: audioMode ? (darkMode ? '#2C2C2C' : '#F5F5F5') : (darkMode ? '#111827' : '#ffffff'), // Tailwind gray/white
                textColor: audioMode ? (darkMode ? '#FFFFFF' : '#000000') : (darkMode ? '#e5e7eb' : '#1f2937'), // Tailwind gray
                mutedTextColor: audioMode ? (darkMode ? '#AAAAAA' : '#787878') : (darkMode ? '#9ca3af' : '#6b7280'), // Tailwind gray
                fontFamily: audioMode ? '"Press Start 2P", cursive' : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                pixelRatio: window.devicePixelRatio || 1
            };
            // Shared rectangle helper (removed later duplicates)
            const drawRect = (x, y, w, h, fill, stroke = null, lineWidth = 1) => {
                if (fill) {
                    ctx.fillStyle = fill;
                    ctx.fillRect(x, y, w, h);
                }
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = lineWidth;
                    ctx.strokeRect(x, y, w, h);
                }
            };

             // --- Calculate Dimensions ---
            const totalVolunteerWidth = multipleLocations
                ? config.locationPairWidth * locationNames.length
                : config.singleLocationWidth;
            const baseWidth = config.timeColumnWidth + totalVolunteerWidth + config.padding * 2;

             // Estimate scripture height
            let scriptureHeight = 0;
            let wrappedScriptureLines = [];
            if (scripturalPoint) {
                const maxScriptureWidth = baseWidth - (config.padding * 2) - (config.scripturePadding * 2);
                ctx.font = `${audioMode ? '0.7' : '0.75'}em ${config.fontFamily}`; // Approx 12px normal, 8px 8bit
                 // Simple word wrapping logic (improve if needed)
                 const words = scripturalPoint.split(' ');
                 let currentLine = '';
                 for (const word of words) {
                     const testLine = currentLine ? `${currentLine} ${word}` : word;
                     if (ctx.measureText(testLine).width > maxScriptureWidth && currentLine) {
                         wrappedScriptureLines.push(currentLine);
                         currentLine = word;
                     } else {
                         currentLine = testLine;
                     }
                 }
                 if (currentLine) wrappedScriptureLines.push(currentLine);

                scriptureHeight = config.scriptureHeaderHeight + (wrappedScriptureLines.length * config.scriptureLineHeight) + config.scripturePadding * 2;
            }

             const headerSectionHeight = config.headerHeight + config.padding;
             const scriptureSectionHeight = scriptureHeight > 0 ? scriptureHeight + config.padding / 2 : 0; // Place between header and table
             const tableHeight = (schedule.length + 1) * config.rowHeight; // +1 for header row
             const legendSectionHeight = config.legendHeight + config.padding; // Includes padding below legend
             const totalHeight = headerSectionHeight + scriptureSectionHeight + tableHeight + legendSectionHeight; // Scripture now between header and table

             // --- Setup Canvas ---
             canvas.width = baseWidth * config.pixelRatio;
             canvas.height = totalHeight * config.pixelRatio;
             canvas.style.width = `${baseWidth}px`;
             canvas.style.height = `${totalHeight}px`;
             ctx.scale(config.pixelRatio, config.pixelRatio);
             ctx.imageSmoothingEnabled = !audioMode; // Pixelated rendering for 8-bit

            // --- Drawing ---

            // Background
            ctx.fillStyle = config.mainRowBgColor;
            ctx.fillRect(0, 0, baseWidth, totalHeight);

             // Scanlines (if 8-bit)
            if (audioMode) {
                const scanlineColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)';
                 ctx.fillStyle = scanlineColor;
                 for (let y = 0; y < totalHeight; y += 3) { // Match CSS
                     ctx.fillRect(0, y, baseWidth, 1);
                 }
            }

             // --- Header ---
            let currentY = config.padding;
            ctx.textAlign = 'center';
            ctx.fillStyle = config.textColor;
            const titleFontSize = audioMode ? '0.9em' : '1.1em'; // ~14px / 18px
            ctx.font = `bold ${titleFontSize} ${config.fontFamily}`;
            const displayTitle = locationName ? `${locationName} Schedule` : 'Volunteer Schedule';
             ctx.fillText(displayTitle, baseWidth / 2, currentY + (audioMode ? 12 : 18)); // Adjust baseline position
             currentY += (audioMode ? 18 : 25);

            ctx.fillStyle = config.mutedTextColor;
            const subtitleFontSize = audioMode ? '0.65em' : '0.8em'; // ~7px / 13px
             ctx.font = `${subtitleFontSize} ${config.fontFamily}`;
             let headerText = '';
             if (dateEnabled) {
                 const dateStr = formatDate(timeRange.date);
                 const timeStr = `${formatTo12Hour(timeRange.startTime)} - ${formatTo12Hour(timeRange.endTime)}`;
                 headerText = `${dateStr} • ${timeStr}`;
             } else {
                 headerText = `${formatTo12Hour(timeRange.startTime)} - ${formatTo12Hour(timeRange.endTime)}`;
             }
             ctx.fillText(headerText, baseWidth / 2, currentY + (audioMode ? 8 : 12));
             currentY += (audioMode ? 15 : 20); // Move down past header text

            // --- Discussion Point (at top, before table) ---
            if (scripturalPoint) {
                const scriptureBoxY = currentY;
                const scriptureBoxWidth = baseWidth - config.padding * 2;
                const scriptureBoxHeight = scriptureHeight;
                const tableLeft = config.padding;

                // Draw Box
                const boxFill = audioMode ? (darkMode ? '#1A1A1A' : '#F0F0F0') : (darkMode ? '#1f2937' : '#f9fafb');
                const boxBorder = config.borderColor;
                const boxLineWidth = audioMode ? 2 : 1;

                drawRect(tableLeft, scriptureBoxY, scriptureBoxWidth, scriptureBoxHeight, boxFill, boxBorder, boxLineWidth);

                // Draw Header
                ctx.fillStyle = config.textColor;
                const scriptureHeaderFontSize = audioMode ? '0.7em' : '0.8em';
                ctx.font = `bold ${scriptureHeaderFontSize} ${config.fontFamily}`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const headerLabel = smpwMode ? 'Scriptural Discussion' : 'Discussion Point';
                ctx.fillText(headerLabel, tableLeft + config.scripturePadding, scriptureBoxY + config.scripturePadding / 2);

                // Draw Text Content
                const scriptureTextFontSize = audioMode ? '0.7em' : '0.75em';
                ctx.font = `${scriptureTextFontSize} ${config.fontFamily}`;
                let textY = scriptureBoxY + config.scriptureHeaderHeight;
                wrappedScriptureLines.forEach(line => {
                    ctx.fillText(line, tableLeft + config.scripturePadding, textY);
                    textY += config.scriptureLineHeight;
                });

                currentY += scriptureHeight + config.padding / 2;
            }

            // --- Table ---
            const tableTop = currentY;
            const tableWidth = baseWidth - config.padding * 2;
            const tableLeft = config.padding;

            // Helper to draw bordered rect (removed duplicate; using shared drawRect)
             // const drawRect = (x, y, w, h, fill, stroke = null, lineWidth = 1) => { ... };

             // Draw Table Borders & Backgrounds
             ctx.lineWidth = audioMode ? 2 : 1;
             ctx.strokeStyle = config.borderColor;

             // Header row background
             drawRect(tableLeft, tableTop, tableWidth, config.rowHeight, config.headerBgColor, config.borderColor, ctx.lineWidth);

             // Data row backgrounds and borders
             for (let i = 0; i < schedule.length; i++) {
                 const rowY = tableTop + (i + 1) * config.rowHeight;
                 const isAltRow = i % 2 === 1;
                 const rowBg = isAltRow ? config.altRowBgColor : config.mainRowBgColor;
                  // Draw row background first (slightly inset if not 8-bit to avoid overdrawing borders)
                 // drawRect(tableLeft + (audioMode ? 0 : 0.5), rowY + (audioMode ? 0 : 0.5) , tableWidth - (audioMode ? 0 : 1) , config.rowHeight - (audioMode ? 0 : 1) , rowBg);
                 // Let's just draw the full rect and then the lines over it for simplicity
                 drawRect(tableLeft, rowY, tableWidth, config.rowHeight, rowBg);
                 // Draw horizontal line below row
                 ctx.beginPath();
                 ctx.moveTo(tableLeft, rowY + config.rowHeight);
                 ctx.lineTo(tableLeft + tableWidth, rowY + config.rowHeight);
                 ctx.stroke();
             }

             // Draw Outer Table Border (overwrites inner lines if needed)
             ctx.strokeRect(tableLeft, tableTop, tableWidth, tableHeight);


             // Draw Vertical Dividers
             let currentX = tableLeft + config.timeColumnWidth;
             ctx.beginPath();
             ctx.moveTo(currentX, tableTop);
             ctx.lineTo(currentX, tableTop + tableHeight);
             ctx.stroke();

             if (multipleLocations) {
                 for (let i = 0; i < locationNames.length; i++) {
                     currentX += config.locationPairWidth;
                      if (i < locationNames.length - 1) { // Don't draw after last location
                         ctx.beginPath();
                         ctx.moveTo(currentX, tableTop);
                         ctx.lineTo(currentX, tableTop + tableHeight);
                         ctx.stroke();
                     }
                 }
             } else {
                 // No additional dividers needed for single location
             }

             // --- Table Header Text ---
             ctx.fillStyle = config.textColor;
             const headerFontSize = audioMode ? '0.65em' : '0.7em'; // ~7px / 11px
             ctx.font = `bold ${headerFontSize} ${config.fontFamily}`;
             ctx.textAlign = 'left';
             ctx.textBaseline = 'middle'; // Center text vertically
             ctx.fillText("Time", tableLeft + (audioMode ? 5 : 8), tableTop + config.rowHeight / 2);

             currentX = tableLeft + config.timeColumnWidth; // Reset X position
             ctx.textAlign = 'center';
             if (multipleLocations) {
                 locationNames.forEach(name => {
                     let displayName = name;
                      // Truncate long location names if needed
                     const maxLocWidth = config.locationPairWidth - (config.locationHeaderPadding * 2);
                     if (ctx.measureText(name).width > maxLocWidth) {
                         while (ctx.measureText(displayName + '…').width > maxLocWidth && displayName.length > 1) {
                             displayName = displayName.slice(0, -1);
                         }
                         displayName += '…';
                     }
                     ctx.fillText(displayName, currentX + config.locationPairWidth / 2, tableTop + config.rowHeight / 2);
                     currentX += config.locationPairWidth;
                 });
             } else {
                 ctx.fillText("Volunteers", currentX + config.singleLocationWidth / 2, tableTop + config.rowHeight / 2);
             }

             // --- Table Data ---
             const dataFontSize = audioMode ? '0.6em' : '0.7em'; // ~7px / 11px
             const tagFontSize = audioMode ? '0.55em' : '0.65em'; // ~6px / 10px
             schedule.forEach((slot, rowIndex) => {
                 const rowY = tableTop + (rowIndex + 1) * config.rowHeight;

                 // Time Cell
                 ctx.fillStyle = config.textColor;
                 ctx.font = `${dataFontSize} ${config.fontFamily}`;
                 ctx.textAlign = 'left';
                 ctx.textBaseline = 'middle';
                  // Use compactDisplay for shorter time format
                 ctx.fillText(slot.compactDisplay, tableLeft + (audioMode ? 5 : 8), rowY + config.rowHeight / 2);


                 // Volunteer Cells
                 let currentCellX = tableLeft + config.timeColumnWidth;
                 ctx.textAlign = 'center';

                 if (multipleLocations) {
                     slot.locations.forEach(location => {
                         let nameTagX = currentCellX + config.volunteerCellPadding + config.locationHeaderPadding; // Start of first name tag in this location pair
                         location.volunteers.forEach(volunteerId => {
                             if (volunteerId) {
                                 const displayName = volunteerMap[volunteerId] || volunteerId;
                                 let truncatedName = displayName;
                                 ctx.font = `${tagFontSize} ${config.fontFamily}`; // Smaller font for tags

                                 // Truncate name if needed
                                 const maxNameWidth = config.volunteerCellWidth - (audioMode ? 4 : 6); // Padding inside tag
                                 if (ctx.measureText(displayName).width > maxNameWidth) {
                                     while (ctx.measureText(truncatedName + '…').width > maxNameWidth && truncatedName.length > 1) {
                                         truncatedName = truncatedName.slice(0, -1);
                                     }
                                     truncatedName += '…';
                                 }

                                 // Draw Tag Background
                                 const tagY = rowY + config.volunteerCellPadding;
                                 const tagH = config.rowHeight - (config.volunteerCellPadding * 2);
                                 const tagFill = colors[volunteerId]?.bg || config.altRowBgColor;
                                 const tagText = colors[volunteerId]?.text || config.textColor;
                                 const tagBorder = audioMode ? (darkMode ? '#CCC' : '#000') : null;
                                 const tagLineWidth = audioMode ? 2 : 1;

                                 drawRect(nameTagX, tagY, config.volunteerCellWidth, tagH, tagFill, tagBorder, tagLineWidth);

                                 // Draw Tag Text
                                 ctx.fillStyle = tagText;
                                 ctx.fillText(truncatedName, nameTagX + config.volunteerCellWidth / 2, tagY + tagH / 2);
                             }
                             nameTagX += config.volunteerCellWidth + config.volunteerCellPadding; // Move to next tag position
                         });
                         currentCellX += config.locationPairWidth; // Move to next location column
                     });
                 } else { // Single Location
                     let nameTagX = currentCellX + config.volunteerCellPadding;
                     slot.volunteers.forEach(volunteerId => {
                         if (volunteerId) {
                             const displayName = volunteerMap[volunteerId] || volunteerId;
                             let truncatedName = displayName;
                             ctx.font = `${tagFontSize} ${config.fontFamily}`;

                             const maxNameWidth = config.volunteerCellWidth - (audioMode ? 4 : 6);
                             if (ctx.measureText(displayName).width > maxNameWidth) {
                                  while (ctx.measureText(truncatedName + '…').width > maxNameWidth && truncatedName.length > 1) {
                                         truncatedName = truncatedName.slice(0, -1);
                                     }
                                     truncatedName += '…';
                             }

                             const tagY = rowY + config.volunteerCellPadding;
                             const tagH = config.rowHeight - (config.volunteerCellPadding * 2);
                             const tagFill = colors[volunteerId]?.bg || config.altRowBgColor;
                             const tagText = colors[volunteerId]?.text || config.textColor;
                             const tagBorder = audioMode ? (darkMode ? '#CCC' : '#000') : null;
                             const tagLineWidth = audioMode ? 2 : 1;

                             drawRect(nameTagX, tagY, config.volunteerCellWidth, tagH, tagFill, tagBorder, tagLineWidth);

                             ctx.fillStyle = tagText;
                             ctx.fillText(truncatedName, nameTagX + config.volunteerCellWidth / 2, tagY + tagH / 2);
                         }
                         nameTagX += config.volunteerCellWidth + config.volunteerCellPadding;
                     });
                 }
             });


             // --- Legend ---
             currentY = tableTop + tableHeight + config.padding / 2;
             let legendY = currentY; // changed from const to let (was mutated)
             let legendX = tableLeft;
             // Fallback shiftCounts computation if not precomputed
             let shiftCounts = schedule[0]?.shiftCounts || {};
             if (!shiftCounts || Object.keys(shiftCounts).length === 0) {
                 shiftCounts = {};
                 schedule.forEach(slot => {
                     const ids = multipleLocations
                         ? slot.locations.flatMap(l => l.volunteers)
                         : slot.volunteers;
                     ids.forEach(id => {
                         if (id) shiftCounts[id] = (shiftCounts[id] || 0) + 1;
                     });
                 });
             }
             const volunteerIdsInSchedule = Object.keys(shiftCounts).filter(id => shiftCounts[id] > 0);

             ctx.font = `${legendFontSize} ${config.fontFamily}`;
             ctx.textBaseline = 'middle';
             ctx.textAlign = 'center';

             volunteerIdsInSchedule.forEach(volunteerId => {
                 const count = shiftCounts[volunteerId];
                 const displayName = volunteerMap[volunteerId] || volunteerId;
                 let truncatedName = displayName;

                 // Truncate legend name if very long
                  const maxLegendNameWidth = audioMode ? 60 : 80;
                  if (ctx.measureText(displayName).width > maxLegendNameWidth) {
                      while (ctx.measureText(truncatedName + '…').width > maxLegendNameWidth && truncatedName.length > 1) {
                          truncatedName = truncatedName.slice(0, -1);
                      }
                      truncatedName += '…';
                 }
                 const legendText = `${truncatedName}: ${count}`;
                 const textMetrics = ctx.measureText(legendText);
                 const legendTagWidth = textMetrics.width + (audioMode ? 10 : 12); // Padding inside tag

                  // Prevent legend going off canvas - wrap if necessary (simple wrap)
                 if (legendX + legendTagWidth > baseWidth - config.padding) {
                     legendX = tableLeft;
                     legendY += legendTagHeight + (audioMode ? 3 : 4);
                 }


                 const tagFill = colors[volunteerId]?.bg || config.altRowBgColor;
                 const tagText = colors[volunteerId]?.text || config.textColor;
                 const tagBorder = audioMode ? (darkMode ? '#CCC' : '#000') : null;
                 const tagLineWidth = audioMode ? 2 : 1;

                 drawRect(legendX, legendY, legendTagWidth, legendTagHeight, tagFill, tagBorder, tagLineWidth);

                 ctx.fillStyle = tagText;
                 ctx.fillText(legendText, legendX + legendTagWidth / 2, legendY + legendTagHeight / 2);

                 legendX += legendTagWidth + (audioMode ? 4 : 6); // Space between tags
             });
             currentY = legendY + legendTagHeight + config.padding / 2; // Update Y position below the last legend line

             // --- Resolve Promise ---
            canvas.toBlob((blob) => {
                if (blob) {
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve({ blob, dataUrl });
                } else {
                    reject(new Error("Canvas toBlob failed"));
                }
            }, 'image/png');

        } catch (err) {
            reject(err);
        }
    });
};