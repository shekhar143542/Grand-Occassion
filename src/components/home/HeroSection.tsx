import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center animate-pan"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920&q=80')`,
          backgroundSize: '120%',
        }}
      />
      <div className="absolute inset-0 hero-gradient opacity-85" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 border border-secondary/20 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-48 h-48 border border-secondary/10 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-secondary/40 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-secondary/30 rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-sm text-primary-foreground/90">
              Premium Venue Booking
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Create Moments
            <span className="block shimmer">Worth Celebrating</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience luxury at its finest. Our exquisite banquet halls provide the perfect 
            backdrop for weddings, corporate events, and celebrations that leave lasting impressions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/halls">
                Explore Venues
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/halls#tour">
                <Play className="mr-2 h-5 w-5" />
                Virtual Tour
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-serif font-bold text-secondary">4+</p>
              <p className="text-sm text-primary-foreground/70 mt-1">Luxury Venues</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-serif font-bold text-secondary">500+</p>
              <p className="text-sm text-primary-foreground/70 mt-1">Events Hosted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-serif font-bold text-secondary">98%</p>
              <p className="text-sm text-primary-foreground/70 mt-1">Happy Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-primary-foreground/60 uppercase tracking-widest">Scroll</span>
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary-foreground/60 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
