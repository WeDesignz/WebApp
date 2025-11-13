import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import SpotlightCard from "@/components/SpotlightCard";
import dynamic from "next/dynamic";
import CSSParticles from "@/components/CSSParticles";
import JerseyShowcase from "@/components/JerseyShowcase";
import MagicBento from "@/components/MagicBento";
import PricingPlans from "@/components/PricingPlans";
import CreatorCallout from "@/components/CreatorCallout";
import JoinAsFreelancerCTA from "@/components/JoinAsFreelancerCTA";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ClientsStats from "@/components/ClientsStats";
import SpotlightFeatures from "@/components/SpotlightFeatures";
import CardSlider from "@/components/CardSlider";

export const metadata = {
  title: "WeDesign - Creative Design Marketplace",
  description: "Empowering Creative Collaboration",
};

export default function Page() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CSSParticles particleCount={150} className="opacity-60" />
      </div>
      <div className="relative z-10">
      <Navbar />
      <HeroSection />
      <ClientsStats />
      <SpotlightFeatures />
      
      <GallerySection />
      <CardSlider title="Popular Categories" items={[
        { title: 'Poster Design', desc: 'Eye-catching visual communications', image: '/generated_images/Typography_Poster_Design_be3980bc.png' },
        { title: 'Web Design', desc: 'Stunning websites & landing pages', image: '/generated_images/Website_Mockup_Design_f379e810.png' },
        { title: 'Logo Design', desc: 'Memorable brand identities', image: '/generated_images/Brand_Identity_Design_67fa7e1f.png' },
        { title: 'UI/UX Design', desc: 'Beautiful user experiences', image: '/generated_images/Mobile_App_Interface_672164f7.png' }
      ]} />
      <MagicBento enableStars enableSpotlight enableBorderGlow enableTilt enableMagnetism clickEffect glowColor="132, 0, 255" spotlightRadius={300} />
      <CardSlider title="Trending Collections" items={[
        { title: 'Minimal UI', desc: 'Calm interfaces with focus', image: '/generated_images/Modern_UI_Dashboard_Design_159dd6b9.png' },
        { title: 'Neon Cyber', desc: 'Vibrant futuristic vibes', image: '/generated_images/Creative_Character_Illustration_04c3e6df.png' },
        { title: 'Material 3', desc: 'Modern components & patterns', image: '/generated_images/Website_Mockup_Design_f379e810.png' },
        { title: 'Isometric', desc: '3D-inspired vector scenes', image: '/generated_images/3D_Product_Rendering_3967b01e.png' }
      ]} />
      <JerseyShowcase />
      <PricingPlans />
      <JoinAsFreelancerCTA />
      <FAQSection />
      <Footer />
      </div>
    </div>
  );
}


