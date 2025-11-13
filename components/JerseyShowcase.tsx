"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Rotate3D, ZoomIn, MousePointer2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ModelViewer = dynamic(
  () => import("@/components/ModelViewerSafe"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
);

const jerseyModels = [
  {
    name: "Classic Sports Jersey",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb",
    description: "Premium polyester blend with moisture-wicking technology",
    color: "Blue & White"
  },
  {
    name: "Modern Football Kit",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb",
    description: "Lightweight fabric designed for maximum performance",
    color: "Red & Black"
  },
  {
    name: "Retro Basketball Jersey",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb",
    description: "Classic mesh design with authentic team branding",
    color: "Gold & Purple"
  }
];

export default function JerseyShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentJersey = jerseyModels[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? jerseyModels.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === jerseyModels.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            Experience Designs in 3D
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Rotate, zoom, and explore jersey designs from every angle. See exactly what you're getting before you buy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 3D Viewer */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm p-8">
              <div className="aspect-square flex items-center justify-center">
                <ModelViewer
                  key={currentJersey.url}
                  url={currentJersey.url}
                  width="100%"
                  height="100%"
                  enableManualRotation
                  enableManualZoom
                  autoRotate
                  autoRotateSpeed={0.5}
                  environmentPreset="studio"
                  fadeIn
                />
              </div>
              
              {/* Navigation Arrows */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  size="icon"
                  className="rounded-full pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleNext}
                  variant="outline"
                  size="icon"
                  className="rounded-full pointer-events-auto bg-background/80 backdrop-blur-sm hover:bg-background border-border/50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Model Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs font-medium">
                {currentIndex + 1} / {jerseyModels.length}
              </div>
            </div>
          </motion.div>

          {/* Information Panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl font-bold mb-3">{currentJersey.name}</h3>
              <p className="text-foreground/70 mb-2">{currentJersey.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {currentJersey.color}
                </span>
              </div>
            </div>

            {/* Interactive Controls Guide */}
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4">
              <h4 className="font-semibold text-lg mb-4">Interactive Controls</h4>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Rotate3D className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Rotate</p>
                  <p className="text-sm text-foreground/60">Click and drag to rotate the model in any direction</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ZoomIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Zoom</p>
                  <p className="text-sm text-foreground/60">Scroll or pinch to zoom in and see fine details</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MousePointer2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Auto-Rotate</p>
                  <p className="text-sm text-foreground/60">Model rotates automatically when not interacting</p>
                </div>
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-3">
              <h4 className="font-semibold">Browse Designs</h4>
              <div className="grid grid-cols-3 gap-3">
                {jerseyModels.map((jersey, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative rounded-xl border-2 transition-all p-3 text-left ${
                      index === currentIndex
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card/30 hover:border-primary/50'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{jersey.name}</p>
                    <p className="text-xs text-foreground/60 truncate">{jersey.color}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full rounded-full py-6 bg-gradient-to-r from-primary to-purple-600 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all font-semibold text-base">
              Explore Full Collection →
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
