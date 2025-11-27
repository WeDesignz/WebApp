"use client";

import { Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    hours: 8,
    minutes: 26,
    seconds: 58
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredDesigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  const getCardStyle = (index: number) => {
    const diff = (index - currentIndex + featuredDesigns.length) % featuredDesigns.length;
    if (diff === 0) {
      return { zIndex: 30, x: 0, y: 0, scale: 1, opacity: 1, rotateY: 0 };
    } else if (diff === 1) {
      return { zIndex: 20, x: 20, y: 10, scale: 0.95, opacity: 0.7, rotateY: -5 };
    } else {
      return { zIndex: 10, x: 40, y: 20, scale: 0.9, opacity: 0.4, rotateY: -10 };
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 md:px-8 lg:px-12">
      <div className="w-full max-w-7xl mx-auto">
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

          {/* Right Side - Stacked Cards */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 -m-8 lg:-m-12">
              <div 
                className="w-full h-full opacity-30"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                  backgroundSize: '32px 32px'
                }}
              />
            </div>

            {/* Stacked Cards Container */}
            <div className="relative w-[280px] md:w-[320px] h-[380px] md:h-[420px]" style={{ perspective: '1000px' }}>
              {featuredDesigns.map((design, index) => {
                const style = getCardStyle(index);
                return (
                  <motion.div
                    key={design.id}
                    animate={{
                      x: style.x,
                      y: style.y,
                      scale: style.scale,
                      opacity: style.opacity,
                      rotateY: style.rotateY,
                      zIndex: style.zIndex
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-b from-white/5 to-black/40 border border-white/10 backdrop-blur-sm shadow-2xl"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Timer Badge - Only on front card */}
                    {index === currentIndex && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-white text-xs font-medium">
                            {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
                          </span>
                        </div>
                      </div>
                    )}

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
                    <div className="h-[35%] p-4 bg-black/50 backdrop-blur-sm flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {design.title.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold text-sm">{design.title}</h3>
                            <p className="text-white/50 text-xs">{design.creator}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white/50 text-[10px] uppercase tracking-wider">Current Bid</p>
                          <p className="text-white font-bold text-sm">{design.price}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Explore Button - Circular */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-4 right-0 lg:right-8 hidden md:block"
            >
              <a 
                href="/customer-dashboard"
                className="group flex items-center justify-center w-16 h-16 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300 hover:scale-110"
              >
                <div className="relative">
                  <svg className="w-14 h-14 animate-spin-slow" viewBox="0 0 100 100">
                    <defs>
                      <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"/>
                    </defs>
                    <text className="text-[10px] fill-white/70 uppercase tracking-[0.2em]">
                      <textPath href="#circlePath">
                        EXPLORE • DESIGNS •
                      </textPath>
                    </text>
                  </svg>
                  <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
