"use client";

import { Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import CardSwap, { Card } from './CardSwap';
import { apiClient } from '@/lib/api';
import { preferAvifForDisplay } from '@/lib/utils/transformers';

interface HeroDesign {
  id: number;
  title: string;
  creator: string;
  product_number?: string;
  price: string;
  image: string | null;
}

export default function HeroSection() {
  const [featuredDesigns, setFeaturedDesigns] = useState<HeroDesign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    const fetchHeroDesigns = async () => {
      try {
        // Try using apiClient.catalogAPI if available, otherwise use direct fetch
        let designsData: HeroDesign[] = [];
        
        if (apiClient.catalogAPI?.getHeroSectionDesigns) {
          try {
            const response = await apiClient.catalogAPI.getHeroSectionDesigns();
            if (response.data?.designs && Array.isArray(response.data.designs)) {
              designsData = response.data.designs;
            }
          } catch (apiError) {
            // Silently fall through to direct fetch
          }
        }
        
        // If no data from API client, try direct fetch
        if (designsData.length === 0) {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
          const url = `${apiBaseUrl}/api/catalog/hero-section/`;
          
          const fetchResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status}`);
          }
          
          const data = await fetchResponse.json();

          // Handle both response formats
          if (data.designs && Array.isArray(data.designs)) {
            designsData = data.designs;
          } else if (data.data?.designs && Array.isArray(data.data.designs)) {
            designsData = data.data.designs;
          }
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setFeaturedDesigns(designsData);
          setIsLoading(false);
        }
      } catch (error) {
        // Only update state if component is still mounted
        if (isMounted) {
          setFeaturedDesigns([]);
          setIsLoading(false);
        }
      }
    };

    fetchHeroDesigns();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 md:px-8 lg:px-12">
      {/* Extended Grid Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="w-full h-full relative"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
      </div>
      
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Side - Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }} 
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-[-0.03em] text-white leading-[1.1]">
                Discover,
                <br />
                collect, and sell
                <br />
                extraordinary{' '}
                <span className="font-semibold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  Designs
                </span>
              </h1>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-2 text-white/70 text-base md:text-lg"
            >
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              India's premier design marketplace for jerseys, vectors, mockups, and custom designs
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <a 
                href="/customer-dashboard"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-medium text-base hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20"
              >
                Browse Designs
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="/designer-console"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-medium text-base hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
              >
                Sell Your Designs
              </a>
            </motion.div>
          </motion.div>

          {/* Right Side - Card Swap */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center items-center mt-24 md:mt-28"
            style={{ height: '600px', position: 'relative' }}
          >
            {isLoading ? (
              <div className="text-white/50 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/30 mx-auto mb-2"></div>
                <p>Loading designs...</p>
              </div>
            ) : featuredDesigns.length > 0 ? (
              <CardSwap
                width={360}
                height={480}
                cardDistance={50}
                verticalDistance={60}
                delay={4000}
                pauseOnHover={false}
                easing="elastic"
              >
                {featuredDesigns.map((design) => (
                  <Card
                    key={design.id}
                    customClass="overflow-hidden bg-gradient-to-b from-white/5 to-black/40 border border-white/10 backdrop-blur-sm shadow-2xl"
                  >
                    {/* Circular WeDesign Logo Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/30 bg-black backdrop-blur-sm shadow-lg">
                        <img 
                          src="/Logos/ONLY LOGO.png" 
                          alt="WeDesignz logo"
                          className="h-8 w-auto object-contain brightness-0 invert"
                        />
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div className="h-[65%] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 z-10" />
                      {design.image ? (
                        <img 
                          src={preferAvifForDisplay(design.image) || design.image} 
                          alt={design.title || 'Design preview'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Fallback to original URL if AVIF fails
                            if (target.src !== design.image && design.image) {
                              target.src = design.image;
                            } else {
                              // Use a data URI placeholder to prevent 404 loops
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%231a1a1a" width="400" height="400"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                              target.onerror = null; // Prevent infinite loop
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <p className="text-white/50 text-sm">No image</p>
                        </div>
                      )}
                    </div>

                    {/* Card Info Footer */}
                    <div className="h-[35%] p-5 bg-black/50 backdrop-blur-sm flex flex-col justify-center">
                        <div>
                          <h3 className="text-white font-semibold text-base">{design.title || 'Design'}</h3>
                          {design.product_number && (
                            <p className="text-white/50 text-xs mt-0.5">#{design.product_number}</p>
                          )}
                      </div>
                    </div>
                  </Card>
                ))}
              </CardSwap>
            ) : (
              <div className="text-white/50 text-center">
                <p className="mb-2">No designs available</p>
                <p className="text-sm text-white/30">Please configure hero section designs in admin panel</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
