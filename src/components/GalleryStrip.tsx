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
              className="keen-slider__slide flex items-center justify-center bg-black relative"
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
              {/* Overlay caption and button */}
              {(item.caption || item.buttonText) && (
                <div className="absolute left-0 bottom-0 h-full flex flex-col items-start justify-end pl-10 pb-8" style={{ width: '100%', pointerEvents: 'none' }}>
                  <div
                    className="flex flex-col items-start"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      maxWidth: 700,
                      width: '80%',
                      background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%)',
                      padding: '1.5rem 2.5rem',
                      pointerEvents: 'auto',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                    }}
                  >
                    {item.caption && (
                      <div
                        className="text-white font-bold text-3xl md:text-4xl lg:text-5xl mb-2 leading-tight z-10"
                        style={{ lineHeight: 1.1 }}
                        // SECURITY: Only use this if you trust Strapi content
                        dangerouslySetInnerHTML={{ __html: item.caption }}
                      />
                    )}
                    {item.subtitle && (
                      <div
                        className="text-[15px] md:text-[17px] text-gray-200 mb-4 z-10"
                        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 400, lineHeight: 1.25 }}
                        dangerouslySetInnerHTML={{ __html: item.subtitle }}
                      />
                    )}
                    {item.buttonText && (
                      <a
                        href={item.buttonUrl || item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-accent text-black px-6 py-3 rounded-full font-medium hover:bg-accent/80 transition-all text-lg shadow-lg z-10"
                        style={{ marginTop: '0.5rem', pointerEvents: 'auto' }}
                      >
                        {item.buttonText}
                      </a>
                    )}
                  </div>
                </div>
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