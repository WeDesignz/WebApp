"use client";

import { Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function HeroSection() {
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

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 md:px-8 lg:px-12">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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

          {/* Right Side - Featured Design Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30, scale: 0.95 }} 
            animate={{ opacity: 1, x: 0, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 -m-4">
              <div 
                className="w-full h-full opacity-20"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />
            </div>

            {/* Main Featured Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-white/5 to-transparent border border-white/10 backdrop-blur-sm">
              {/* Timer Badge */}
              <div className="absolute top-4 left-4 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white text-sm font-medium">
                    {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
                  </span>
                </div>
              </div>

              {/* Featured Image */}
              <div className="aspect-square relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                <img 
                  src="/generated_images/Brand_Identity_Design_67fa7e1f.png" 
                  alt="Featured Design"
                  className="w-full h-full object-cover"
                />
                {/* Glowing Figure Overlay Effect */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-32 bg-gradient-to-t from-white/0 via-white/30 to-white/60 blur-xl rounded-full" />
                </div>
              </div>

              {/* Card Info Footer */}
              <div className="p-5 bg-black/40 backdrop-blur-sm border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">W</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">Stellar Brand</h3>
                      <p className="text-white/60 text-sm">@wedesignz</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs uppercase tracking-wider">Current Bid</p>
                    <p className="text-white font-bold text-lg">$299</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Mini Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -top-4 -right-4 w-24 h-24 rounded-xl overflow-hidden border border-white/10 shadow-2xl hidden lg:block"
            >
              <img 
                src="/generated_images/Typography_Poster_Design_be3980bc.png" 
                alt="Design Preview"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -bottom-4 -left-4 w-20 h-20 rounded-xl overflow-hidden border border-white/10 shadow-2xl hidden lg:block"
            >
              <img 
                src="/generated_images/Mobile_App_Interface_672164f7.png" 
                alt="Design Preview"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Explore Button - Circular */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-6 -right-6 hidden lg:block"
            >
              <a 
                href="/customer-dashboard"
                className="group flex items-center justify-center w-20 h-20 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300 hover:scale-110"
              >
                <div className="relative">
                  <svg className="w-16 h-16 animate-spin-slow" viewBox="0 0 100 100">
                    <defs>
                      <path id="circlePath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"/>
                    </defs>
                    <text className="text-[11px] fill-white/70 uppercase tracking-[0.3em]">
                      <textPath href="#circlePath">
                        EXPLORE • DESIGNS •
                      </textPath>
                    </text>
                  </svg>
                  <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white group-hover:translate-x-0 transition-transform" />
                </div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
