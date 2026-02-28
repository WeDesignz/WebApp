"use client";

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { preferAvifForDisplay } from '@/lib/utils/transformers';

const DomeGallery = dynamic(() => import('./DomeGallery'), { ssr: false });

interface GalleryImage {
  src: string;
  alt: string;
}

const MOBILE_BREAKPOINT_PX = 768;

export default function GallerySection() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsLoading(false);
      return;
    }

    const fetchGalleryImages = async () => {
      try {
        // Try using apiClient.catalogAPI if available, otherwise use direct fetch
        let response;
        if (apiClient.catalogAPI?.getDomeGalleryImages) {
          response = await apiClient.catalogAPI.getDomeGalleryImages();
          if (response.data?.images) {
            const transformedImages = response.data.images.map((img: GalleryImage) => ({
              ...img,
              src: preferAvifForDisplay(img.src) || img.src
            }));
            setGalleryImages(transformedImages);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to direct fetch
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const fetchResponse = await fetch(`${apiBaseUrl}/api/catalog/dome-gallery/`);
        const data = await fetchResponse.json();
        
        if (data.images) {
          const transformedImages = data.images.map((img: GalleryImage) => ({
            ...img,
            src: preferAvifForDisplay(img.src) || img.src
          }));
          setGalleryImages(transformedImages);
        }
      } catch (error) {
        // Fallback to empty array
        setGalleryImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, [isMobile]);

  const showGlobe = !isMobile;

  return (
    <section id="gallery" className="py-32 relative overflow-hidden hidden md:block">
      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-20 hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Featured Design Gallery
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Discover premium designs from our verified designer community. From jerseys to vectors, mockups to 3D models - find exactly what you need for your next project.
          </p>
        </motion.div>
      </div>

      {showGlobe && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full"
          style={{ height: '70vh', minHeight: '500px' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Loading gallery...</p>
            </div>
          ) : galleryImages.length > 0 ? (
            <DomeGallery images={galleryImages} grayscale={false} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No images available</p>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center mt-12 hidden md:block"
      >
        <p className="text-sm text-muted-foreground">
          Browse our design collection • Click to view details • Subscribe to download premium designs
        </p>
      </motion.div>
    </section>
  );
}


