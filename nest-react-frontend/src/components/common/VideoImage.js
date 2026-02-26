import React, { useRef, useEffect, useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils';

/**
 * Component that uses video as HD image source by extracting first frame
 * Falls back to thumbnail if video extraction fails
 */
const VideoImage = ({ src, alt, className, onLoad, fallback }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(fallback || src); // Start with fallback
  const [error, setError] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    // If not a video, use image directly
    if (!src || !src.endsWith('.mp4')) {
      setImageSrc(getImageUrl(src) || src);
      return;
    }

    // If we have a fallback, show it immediately
    if (fallback) {
      setImageSrc(getImageUrl(fallback) || fallback);
    }

    const video = videoRef.current;
    if (!video) return;

    setExtracting(true);

    const extractFrame = () => {
      try {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn('Video dimensions are 0, using fallback');
          setError(true);
          return;
        }

        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Only update if extraction was successful
        if (dataUrl && dataUrl !== 'data:,') {
          setImageSrc(dataUrl);
          setExtracting(false);
          if (onLoad) onLoad();
        } else {
          setError(true);
          setExtracting(false);
        }
      } catch (err) {
        console.error('Error extracting frame from video:', err);
        setError(true);
        setExtracting(false);
      }
    };

    const handleLoadedMetadata = () => {
      // Seek to a small time to ensure we have a frame
      video.currentTime = 0.1;
    };

    const handleSeeked = () => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        extractFrame();
      }
    };

    const handleLoadedData = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        extractFrame();
      } else {
        // Try again after a short delay
        setTimeout(() => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            extractFrame();
          } else {
            setError(true);
            setExtracting(false);
          }
        }, 500);
      }
    };

    const handleError = (e) => {
      console.error('Video load error:', e);
      setError(true);
      setExtracting(false);
    };

    const handleCanPlay = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        extractFrame();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    // Load the video
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [src, fallback, onLoad]);

  // Always show an image - either extracted frame or fallback
  return (
    <>
      {src && src.endsWith('.mp4') && (
        <>
          <video
            ref={videoRef}
            src={src}
            muted
            playsInline
            preload="metadata"
            style={{ display: 'none', position: 'absolute' }}
            crossOrigin="anonymous"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}
      <img 
        src={getImageUrl(imageSrc) || imageSrc || getImageUrl(fallback) || fallback || getImageUrl(src) || src} 
        alt={alt} 
        className={className}
        onLoad={onLoad}
        onError={(e) => {
          // If main image fails, try fallback
          if (fallback && e.target.src !== (getImageUrl(fallback) || fallback)) {
            setImageSrc(fallback);
          } else {
            // Last resort - use placeholder or original src
            console.warn('All image sources failed for:', src);
          }
        }}
        style={{ 
          opacity: extracting && !error ? 0.7 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    </>
  );
};

export default VideoImage;

