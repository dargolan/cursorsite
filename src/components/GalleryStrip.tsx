import React, { useEffect, useRef, useState } from 'react';
import { getGalleryItems, GalleryItem } from '../services/gallery';
import { useKeenSlider } from 'keen-slider/react';
import Link from 'next/link';
import 'keen-slider/keen-slider.min.css';

export default function GalleryStrip() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [sliderRef, instanceRef] = useKeenSlider({
    slides: { perView: 1 },
    slideChanged(s: any) {
      setCurrentSlide(s.track.details.rel);
    },
    loop: true,
    renderMode: 'performance',
  });

  useEffect(() => {
    getGalleryItems().then(data => {
      setItems(data);
      setLoading(false);
      // Debug log for mediaUrl and linkUrl
      console.log('[GalleryStrip] Gallery items:', data.map(i => ({ mediaUrl: i.mediaUrl, linkUrl: i.linkUrl, type: i.type })));
    });
  }, []);

  // Autoplay video on slide change
  useEffect(() => {
    items.forEach((item, idx) => {
      const ref = videoRefs.current[idx];
      if (item.type === 'video' && ref) {
        if (idx === currentSlide) {
          ref.currentTime = 0;
          ref.play().catch(() => {});
        } else {
          ref.pause();
          ref.currentTime = 0;
        }
      }
    });
  }, [currentSlide, items]);

  // Autoplay slide change every 10 seconds
  useEffect(() => {
    if (!items.length) return;
    const timer = setTimeout(() => {
      instanceRef.current?.next();
    }, 10000);
    return () => clearTimeout(timer);
  }, [currentSlide, items, instanceRef]);

  if (loading) return <div className="mb-8 text-gray-400">Loading gallery...</div>;
  if (!items.length) return null;

  return (
    <div className="w-full mb-8">
      <div
        ref={sliderRef}
        className="keen-slider rounded-lg overflow-hidden"
        style={{ height: '260px', width: '100%' }}
      >
        {items.map((item, idx) => {
          const isInternal = item.linkUrl && item.linkUrl.startsWith('/');
          const media = item.type === 'video' ? (
            <video
              ref={el => { videoRefs.current[idx] = el; }}
              src={item.mediaUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
              controls={false}
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster={undefined}
              loop={true}
            />
          ) : (
            <img
              src={item.mediaUrl}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
            />
          );
          return (
            <div
              className="keen-slider__slide flex items-center justify-center bg-black"
              key={item.id}
              style={{ width: '100%', height: '260px' }}
            >
              {item.linkUrl ? (
                isInternal ? (
                  <Link href={item.linkUrl} className="w-full h-full block">
                    {media}
                  </Link>
                ) : (
                  <a 
                    href={item.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full h-full block"
                    onClick={(e) => {
                      // Only open in new tab if it's an external link
                      if (!item.linkUrl.startsWith('/')) {
                        e.preventDefault();
                        window.open(item.linkUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {media}
                  </a>
                )
              ) : (
                media
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-center mt-2 space-x-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            className={`w-2 h-2 rounded-full ${currentSlide === idx ? 'bg-blue-500' : 'bg-gray-400'}`}
            onClick={() => instanceRef.current?.moveToIdx(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 