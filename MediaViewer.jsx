
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MediaViewer = ({ mediaUrls, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex]);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaUrls.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + mediaUrls.length) % mediaUrls.length);
  };

  const currentMedia = mediaUrls[currentIndex];
  const isVideo = currentMedia.match(/\.(mp4|webm)$/);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-[95vw] h-[90vh] max-w-6xl flex flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        
        {mediaUrls.length > 1 && (
            <>
                <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white" onClick={handlePrev}>
                    <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white" onClick={handleNext}>
                    <ChevronRight className="h-8 w-8" />
                </Button>
            </>
        )}

        <div className="w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-full max-h-full"
                >
                    {isVideo ? (
                        <video src={currentMedia} controls autoPlay className="max-w-full max-h-[75vh] rounded-lg object-contain shadow-2xl" />
                    ) : (
                        <img src={currentMedia} alt={`media-${currentIndex}`} className="max-w-full max-h-[75vh] rounded-lg object-contain shadow-2xl" />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        {mediaUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl">
             <div className="flex justify-center gap-3 p-2 rounded-xl bg-black/50">
              {mediaUrls.map((url, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-16 h-12 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                    index === currentIndex ? 'border-blue-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`thumbnail-${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MediaViewer;
