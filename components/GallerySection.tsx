"use client";

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import DomeGallery from './DomeGallery';
import { apiClient } from '@/lib/api';

interface GalleryImage {
  src: string;
  alt: string;
}

export default function GallerySection() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        // Try using apiClient.catalogAPI if available, otherwise use direct fetch
        let response;
        if (apiClient.catalogAPI?.getDomeGalleryImages) {
          response = await apiClient.catalogAPI.getDomeGalleryImages();
          if (response.data?.images) {
            setGalleryImages(response.data.images);
            setIsLoading(false);
            return;
          }
        }
        
        // Fallback to direct fetch
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const fetchResponse = await fetch(`${apiBaseUrl}/api/catalog/dome-gallery/`);
        const data = await fetchResponse.json();
        
        if (data.images) {
          setGalleryImages(data.images);
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
        // Fallback to empty array
        setGalleryImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  return (
    <section id="gallery" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            Featured Design Work
          </h2>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Explore exceptional work from our global community of talented designers. Each piece
            represents the pinnacle of creative excellence.
          </p>
        </motion.div>
      </div>

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

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center mt-12"
      >
        <p className="text-sm text-muted-foreground">
          Drag to explore • Click to enlarge
        </p>
      </motion.div>
    </section>
  );
}


