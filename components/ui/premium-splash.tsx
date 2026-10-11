import React from "react";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

export function PremiumSplash() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center bg-background"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center w-full max-w-xs space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className="relative">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            
            {/* Logo Container */}
            <div className="relative size-24 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10 p-0.5 bg-background">
              <div className="relative size-full rounded-[1.8rem] overflow-hidden bg-gradient-to-br from-primary/20 to-transparent">
                <Image
                  src="/android-chrome-192x192.png"
                  alt="RU Coach Logo"
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              </div>
            </div>

            {/* Spinner Ring */}
            <div className="absolute -inset-3">
              <Spinner className="size-full text-primary/40 stroke-[1.5] animate-[spin_3s_linear_infinite]" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground to-foreground/40 bg-clip-text text-transparent uppercase">
              RU Coach
            </h1>
            <span className="text-[0.6rem] font-bold text-muted-foreground/60 uppercase tracking-[0.5em] mt-2">
              Rodrigo Urbina
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-[0.2em] animate-pulse">
              Cargando tu experiencia premium
            </p>
            <div className="px-12">
              <Progress 
                value={undefined} 
                className="h-0.5 bg-primary/10 overflow-hidden" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
