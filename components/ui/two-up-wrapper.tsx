'use client'

import * as React from 'react'
import { ImgComparisonSlider } from '@img-comparison-slider/react'

interface ImageCompareProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
}

export default function TwoUpWrapper({
  beforeImage,
  afterImage,
  beforeLabel = 'Antes',
  afterLabel = 'Después'
}: ImageCompareProps) {
  return (
    <div className="relative w-full h-full group bg-neutral-950 overflow-hidden select-none">
      <style jsx global>{`
        .img-comparison-slider {
          --divider-width: 0px; /* Hidden to use our custom perfectly aligned glow line */
          --default-handle-width: 0px;
          outline: none !important;
          width: 100%;
          height: 100%;
        }

        .img-comparison-slider:focus {
          outline: none;
        }

        /* Clean up any default parts that might interfere */
        .img-comparison-slider::part(divider) {
          display: none;
        }
      `}</style>

      <ImgComparisonSlider className="img-comparison-slider">
        {/* Child 1: Antes */}
        <div slot="first" className="relative w-full h-full pointer-events-none">
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            loading="eager"
          />
          <div className="absolute top-6 left-6 z-10">
             <span className="rounded-2xl bg-black/40 backdrop-blur-xl px-4 py-2 text-[10px] font-black text-white/90 uppercase tracking-[0.2em] border border-white/10 shadow-2xl">
              {beforeLabel}
            </span>
          </div>
        </div>

        {/* Child 2: Después */}
        <div slot="second" className="relative w-full h-full pointer-events-none">
          <img
            src={afterImage}
            alt={afterLabel}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
            loading="eager"
          />
          <div className="absolute top-6 right-6 z-10">
             <span className="rounded-2xl bg-primary/40 backdrop-blur-xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-[0.2em] border border-primary/20 shadow-2xl">
              {afterLabel}
            </span>
          </div>
        </div>

        {/* --- PERFECTLY CENTERED PREMIUM HANDLE --- */}
        <div slot="handle" className="relative z-30 h-full flex items-center justify-center">
           {/* Vertical Glow Line - Anchored at the exact center of the slot */}
           <div className="absolute w-[1.5px] h-full bg-gradient-to-b from-transparent via-white/50 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.4)] pointer-events-none" />
           
           {/* The Glass Handle Button */}
           <div className="relative size-12 md:size-14 rounded-full border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.4),inset_0_0_10px_rgba(255,255,255,0.05)] flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] overflow-hidden">
               <div className="flex items-center gap-2 text-white/90">
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="w-[1px] h-4 bg-white/30 rounded-full" />
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
               </div>
               
               {/* Internal shimmer for extra premium feel */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
           </div>
        </div>
      </ImgComparisonSlider>
    </div>
  )
}
