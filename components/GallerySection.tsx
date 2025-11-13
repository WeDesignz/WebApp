"use client";

import { motion } from 'framer-motion';
import DomeGallery from './DomeGallery';

const galleryImages = [
  { src: "/generated_images/Modern_UI_Dashboard_Design_159dd6b9.png", alt: 'Modern UI Dashboard Design' },
  { src: "/generated_images/Brand_Identity_Design_67fa7e1f.png", alt: 'Brand Identity Design' },
  { src: "/generated_images/Creative_Character_Illustration_04c3e6df.png", alt: 'Creative Character Illustration' },
  { src: "/generated_images/Website_Mockup_Design_f379e810.png", alt: 'Website Mockup Design' },
  { src: "/generated_images/Mobile_App_Interface_672164f7.png", alt: 'Mobile App Interface' },
  { src: "/generated_images/Typography_Poster_Design_be3980bc.png", alt: 'Typography Poster Design' },
  { src: "/generated_images/3D_Product_Rendering_3967b01e.png", alt: '3D Product Rendering' },
];

export default function GallerySection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
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
        <DomeGallery images={galleryImages} grayscale={false} />
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


