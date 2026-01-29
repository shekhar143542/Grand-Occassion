import { ChevronDown, Play, Pause, Shield, CheckCircle } from "lucide-react";
import { useState } from "react";
import Hero360Scene from "./Hero360Scene";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const HeroSection = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [showTrustDialog, setShowTrustDialog] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* 360 Panoramic Background */}
      <div className="absolute inset-0">
        <Hero360Scene />
        {/* Overlay gradients for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50 pointer-events-none" />
        {/* Vignette effect */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, hsl(var(--background) / 0.6) 100%)'
          }}
        />
      </div>


      {/* 360 Badge */}
      <div className="absolute top-24 right-6 md:right-10 z-20">
        <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md border border-primary/30 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-body tracking-wider text-primary uppercase">360° View</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">

        {/* Trust Worthy Badge */}
        <div className="flex items-center justify-center gap-4 mb-8 opacity-0 animate-fade-up">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary" />
          <span className="text-primary text-xs tracking-[0.4em] uppercase font-body">
            Trust Worthy
          </span>
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary" />
        </div>

        {/* Main Heading */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-medium mb-6 opacity-0 animate-fade-up delay-100">
          <span className="block text-foreground drop-shadow-lg">Where Dreams</span>
          <span className="block text-gold-gradient mt-2 drop-shadow-lg">Become Reality</span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up delay-200 drop-shadow-md">
          Experience unparalleled elegance in our exquisite venues.
          Perfect for weddings, corporate events, and celebrations that deserve perfection.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up delay-300">
          <button className="btn-luxury-filled rounded-full min-w-[200px]">
            <span>Explore Venues</span>
          </button>
          <button 
            onClick={() => setShowTrustDialog(true)}
            className="btn-luxury rounded-full min-w-[200px]"
          >
            <span>Request Quote</span>
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto opacity-0 animate-fade-up delay-400">
          {[
            { value: "500+", label: "Events Hosted" },
            { value: "15K", label: "Happy Guests" },
            { value: "40", label: "Years Legacy" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl text-primary mb-1 drop-shadow-lg">
                {stat.value}
              </div>
              <div className="font-body text-xs tracking-wider uppercase text-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-0 animate-fade-up delay-500 z-10">
        <a
          href="#venues"
          className="flex flex-col items-center gap-2 text-foreground/70 hover:text-primary transition-colors"
        >
          <span className="text-xs tracking-widest uppercase font-body">Discover</span>
          <ChevronDown size={20} className="animate-bounce" />
        </a>
      </div>

      {/* Trust & Transparency Dialog */}
      <Dialog open={showTrustDialog} onOpenChange={setShowTrustDialog}>
        <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-md">
          <DialogHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-scale-in">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <DialogTitle className="font-serif text-2xl text-center">
              Our Promise to You
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <p className="text-center text-muted-foreground leading-relaxed">
              We believe in trust, transparency, and treating our clients with the utmost respect.
            </p>
            
            <div className="space-y-4">
              {[
                { text: "No Hidden Charges", delay: "100ms" },
                { text: "100% Transparent Pricing", delay: "200ms" },
                { text: "Zero Fraud Policy", delay: "300ms" },
                { text: "Your Trust is Our Priority", delay: "400ms" }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-fade-up"
                  style={{ animationDelay: item.delay }}
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center">
              <p className="text-sm text-primary font-semibold italic">
                "We don't fool our customers. We build lasting relationships."
              </p>
            </div>

            <button
              onClick={() => setShowTrustDialog(false)}
              className="w-full btn-luxury-filled rounded-full py-3"
            >
              <span>Continue to Request Quote</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
