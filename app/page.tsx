"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import SpotlightCard from "@/components/SpotlightCard";
import JerseyShowcase from "@/components/JerseyShowcase";
// import MagicBento from "@/components/MagicBento";
import PricingPlans from "@/components/PricingPlans";
import CreatorCallout from "@/components/CreatorCallout";
import JoinAsFreelancerCTA from "@/components/JoinAsFreelancerCTA";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ClientsStats from "@/components/ClientsStats";
import SpotlightFeatures from "@/components/SpotlightFeatures";
import CardSlider from "@/components/CardSlider";
import Particles from "@/components/Particles";
import { apiClient } from "@/lib/api";

interface FeaturedDesign {
  id: number;
  title: string;
  creator: string;
  price: string;
  image: string | null;
  category?: string;
}

export default function Page() {
  const [featuredDesigns, setFeaturedDesigns] = useState<Array<{
    id: number;
    title: string;
    creator?: string;
    price?: string;
    category?: string;
    image?: string;
  }>>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchFeaturedDesigns = async () => {
      try {
        const response = await apiClient.catalogAPI.getFeaturedDesigns();
        if (response.data?.designs && Array.isArray(response.data.designs)) {
          // Transform API response to CardSlider format with all available data
          const transformedDesigns = response.data.designs.map((design: FeaturedDesign) => ({
            id: design.id,
            title: design.title,
            creator: design.creator,
            price: design.price,
            category: design.category,
            image: design.image || undefined,
          }));
          setFeaturedDesigns(transformedDesigns);
        } else {
          // Fallback to empty array if no data
          setFeaturedDesigns([]);
        }
      } catch (error) {
        console.error('Error fetching featured designs:', error);
        setFeaturedDesigns([]);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchFeaturedDesigns();
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Particles
          particleColors={['#ffffff', '#ffffff']}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
          className="opacity-60"
        />
      </div>
      <div className="relative z-10 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ClientsStats />
      <SpotlightFeatures />
      
      <GallerySection />
      <CardSlider 
        title="Featured Designs" 
        items={featuredDesigns} 
        isLoading={isLoadingFeatured}
      />
      {/* <MagicBento enableStars enableSpotlight enableBorderGlow enableTilt enableMagnetism clickEffect glowColor="132, 0, 255" spotlightRadius={300} /> */}
      <JerseyShowcase />
      <PricingPlans />
      <JoinAsFreelancerCTA />
      <FAQSection />
      <Footer />
      </div>
    </div>
  );
}


