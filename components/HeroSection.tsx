"use client";

import { Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CardSwap, { Card } from './CardSwap';

const featuredDesigns = [
  {
    id: 1,
    title: "Stellar Brand",
    creator: "@wedesignz",
    price: "$299",
    image: "/generated_images/Brand_Identity_Design_67fa7e1f.png"
  },
  {
    id: 2,
    title: "Neon Dreams",
    creator: "@artmaster",
    price: "$450",
    image: "/generated_images/Typography_Poster_Design_be3980bc.png"
  },
  {
    id: 3,
    title: "Mobile Pro",
    creator: "@uxdesigner",
    price: "$199",
    image: "/generated_images/Mobile_App_Interface_672164f7.png"
  }
];

export default function HeroSection() {

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
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight text-white leading-[1.1]">
                Discover,
                <br />
                collect, and sell
                <br />
                extraordinary{' '}
                <span className="font-normal bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
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
              Buy and sell designs from the world's top creators
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
                Explore
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="/designer-console"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-medium text-base hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
              >
                Create
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
                        src="/Logos/ONLY LOGO.svg" 
                        alt="WeDesign Logo"
                        className="w-8 h-8 object-contain brightness-0 invert"
                      />
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="h-[65%] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 z-10" />
                    <img 
                      src={design.image} 
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Card Info Footer */}
                  <div className="h-[35%] p-5 bg-black/50 backdrop-blur-sm flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 p-2">
                        <img 
                          src="/Logos/ONLY LOGO.svg" 
                          alt="WeDesign Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base">{design.title}</h3>
                        <p className="text-white/50 text-xs mt-0.5">{design.creator}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </CardSwap>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
