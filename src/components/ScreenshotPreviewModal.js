// src/components/ScreenshotPreviewModal.js
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Download, Copy, Smartphone, Info, Check, AlertCircle, Sun, Moon } from 'lucide-react';
import { generateScheduleImageBlob } from '../utils/generateImage'; // Separate image generation logic

const ScreenshotPreviewModal = ({
    isOpen,
    onClose,
    schedule,
    volunteerMap,
    colors,
    timeRange,
    locationName,
    locationNames,
    multipleLocations,
    dateEnabled,
    smpwMode,
    scripturalPoint,
    darkMode: initialDarkMode, // Receive initial dark mode state
    audioMode,
    formatTo12Hour,
    formatDate
}) => {
    const [imageStatus, setImageStatus] = useState('generating'); // generating, ready, error
    const [imageDataUrl, setImageDataUrl] = useState(null);
    const [imageBlob, setImageBlob] = useState(null);
    const [shareStatus, setShareStatus] = useState(null); // null, copying, success, error, ios_prompt
    const [showHelp, setShowHelp] = useState(false);
    const [modalDarkMode, setModalDarkMode] = useState(initialDarkMode); // Local dark mode for preview

    const previewRef = useRef(null); // Ref for the container to potentially screenshot

    const generatePreview = async () => {
        setImageStatus('generating');
        setShareStatus(null);
        try {
            const { blob, dataUrl } = await generateScheduleImageBlob({
                 schedule,
                 volunteerMap,
                 colors, // Pass the current color map
                 timeRange,
                 locationName,
                 locationNames,
                 multipleLocations,
                 dateEnabled,
                 smpwMode,
                 scripturalPoint,
                 darkMode: modalDarkMode, // Use modal's dark mode state
                 audioMode,
                 formatTo12Hour,
                 formatDate
            });
            setImageDataUrl(dataUrl);
            setImageBlob(blob);
            setImageStatus('ready');
        } catch (err) {
            console.error("Error generating schedule image:", err);
            setImageStatus('error');
        }
    };

    // Regenerate preview when modal opens or its dark mode changes
    useEffect(() => {
        if (isOpen) {
             generatePreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, modalDarkMode, schedule]); // Dependencies that trigger regeneration

     // Sync modal dark mode with app dark mode when modal opens
    useEffect(() => {
        if (isOpen) {
            setModalDarkMode(initialDarkMode);
        }
    }, [isOpen, initialDarkMode]);


    const getFilename = () => {
         const dateString = dateEnabled ? timeRange.date.replace(/-/g, '') : 'nodate';
         const locationText = locationName ? `${locationName.replace(/\s+/g, '_').substring(0,15)}` : 'Volunteer';
         return `${locationText}_Schedule_${dateString}.png`;
    }

    const handleDownload = () => {
        if (!imageDataUrl) return;
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = getFilename();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (!imageBlob) return;
        setShareStatus('copying');
        const filename = getFilename();
        const file = new File([imageBlob], filename, { type: 'image/png' });
        const shareData = {
            files: [file],
            title: 'Volunteer Schedule',
            text: `${locationName || 'Volunteer'} Schedule ${dateEnabled ? formatDate(timeRange.date) : ''}`.trim(),
        };

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                setShareStatus('success');
                setTimeout(() => setShareStatus(null), 2500);
            } else if (navigator.clipboard && navigator.clipboard.write) {
                // Fallback: Try clipboard API (might not work on all browsers/OS for images)
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': imageBlob })]);
                    setShareStatus('success'); // Indicate copied
                     setTimeout(() => setShareStatus(null), 2500);
                } catch (clipError) {
                     console.warn('Clipboard write failed:', clipError);
                     if (isIOS) setShareStatus('ios_prompt'); // Special prompt for iOS if clipboard fails
                     else setShareStatus('error'); // Generic error for others
                }
            } else {
                 // No native share or clipboard
                 if (isIOS) setShareStatus('ios_prompt');
                 else setShareStatus('error'); // Show generic error/help
            }
        } catch (error) {
             console.error('Share error:', error);
             // Handle specific errors e.g., AbortError if user cancels share sheet
             if (error.name !== 'AbortError') {
                 setShareStatus('error');
             } else {
                 setShareStatus(null); // Reset if cancelled
             }
        }
    };


    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className={`relative z-40 ${modalDarkMode ? 'dark' : ''} ${audioMode ? 'eight-bit-mode' : ''}`} onClose={onClose}>
                 {/* Overlay */}
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-lg p-5 sm:p-6 text-left align-middle shadow-xl transition-all ${audioMode ? 'eight-bit-panel !max-w-xl' : `${modalDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white'}`}`}>
                                {/* Header */}
                                <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-300 dark:border-gray-700">
                                     <Dialog.Title as="h3" className={`text-lg font-semibold leading-6 flex items-center ${audioMode ? 'eight-bit-heading' : `${modalDarkMode ? 'text-white' : 'text-gray-900'}`}`}>
                                          <Camera size={20} className="mr-2" /> Export Schedule
                                     </Dialog.Title>
                                     <div className="flex items-center space-x-2">
                                         {/* Dark Mode Toggle for Preview */}
                                         <button
                                            onClick={() => setModalDarkMode(!modalDarkMode)}
                                            className={`p-1.5 rounded transition-colors ${audioMode ? 'eight-bit-button !p-1' : `${modalDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}`}
                                            title="Toggle Preview Mode"
                                         >
                                            {modalDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                         </button>
                                        <button onClick={onClose} className={`p-1.5 rounded transition-colors ${audioMode ? 'eight-bit-button !p-1 !border-red-500' : `${modalDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}`}>
                                            <X size={20} />
                                        </button>
                                     </div>
                                </div>

                                {/* Image Preview Area */}
                                <div ref={previewRef} className="mt-4 mb-5 bg-gray-100 dark:bg-gray-700/50 p-3 rounded flex justify-center items-center min-h-[200px] max-h-[60vh] overflow-auto">
                                    {imageStatus === 'generating' && <p className={`text-center ${audioMode ? 'eight-bit-text' : ''}`}>Generating preview...</p>}
                                    {imageStatus === 'error' && <p className={`text-center text-red-500 ${audioMode ? 'eight-bit-text' : ''}`}>Error generating image.</p>}
                                    {imageStatus === 'ready' && imageDataUrl && (
                                        <img src={imageDataUrl} alt="Schedule Preview" className={`max-w-full h-auto shadow-md ${audioMode ? 'pixelated border-2 border-black dark:border-gray-300' : ''}`} />
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                     <button
                                         onClick={handleShare}
                                         disabled={imageStatus !== 'ready' || shareStatus === 'copying'}
                                         className={`flex-1 button-primary ${audioMode ? 'eight-bit-button' : ''} ${imageStatus !== 'ready' || shareStatus === 'copying' ? 'opacity-60' : ''}`}
                                     >
                                         {shareStatus === 'copying' ? 'Sharing...' : shareStatus === 'success' ? <><Check size={18} className="mr-1.5"/> Shared/Copied!</> : shareStatus === 'error' || shareStatus === 'ios_prompt' ? <><AlertCircle size={18} className="mr-1.5"/> Share Failed</> : <><Copy size={18} className="mr-1.5" /> Share / Copy</>}
                                     </button>
                                      <button
                                         onClick={handleDownload}
                                         disabled={imageStatus !== 'ready'}
                                         className={`flex-1 button-secondary ${audioMode ? 'eight-bit-button' : ''} ${imageStatus !== 'ready' ? 'opacity-60' : ''}`}
                                     >
                                          <Download size={18} className="mr-1.5" /> Download PNG
                                     </button>
                                </div>

                                 {/* Help/Instructions Area */}
                                 {(shareStatus === 'error' || shareStatus === 'ios_prompt') && (
                                     <div className={`mt-4 p-3 rounded text-sm ${audioMode ? 'eight-bit-box bg-yellow-100 border-yellow-500' : 'bg-yellow-50 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700/50 text-yellow-800 dark:text-yellow-200'}`}>
                                         <p className={`flex items-center font-medium mb-1 ${audioMode ? 'eight-bit-text' : ''}`}> <Info size={16} className="mr-1.5" /> Sharing Help</p>
                                         {shareStatus === 'ios_prompt' ? (
                                             <p className={audioMode ? 'eight-bit-text' : ''}>iOS detected. Automatic sharing failed. Please use the <b className={audioMode ? '' : 'font-semibold'}>Download PNG</b> button, then share the saved image from your Photos app.</p>
                                         ) : (
                                             <p className={audioMode ? 'eight-bit-text' : ''}>Sharing/copying failed. Your browser might not support this action. Please use the <b className={audioMode ? '' : 'font-semibold'}>Download PNG</b> button instead.</p>
                                         )}
                                     </div>
                                 )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default ScreenshotPreviewModal;