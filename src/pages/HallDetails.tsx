import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BanquetHall } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  DollarSign, 
  ArrowLeft, 
  Check,
  RotateCcw,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function HallDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const { data: hall, isLoading } = useQuery({
    queryKey: ['hall', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banquet_halls')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as BanquetHall;
    },
    enabled: !!id,
  });

  // 360 rotation effect
  useEffect(() => {
    let animationFrame: number;
    if (isRotating) {
      const animate = () => {
        setRotation((prev) => (prev + 0.3) % 360);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isRotating]);

  // Mouse drag for panorama
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    setIsRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - lastX.current;
    setRotation((prev) => prev + delta * 0.3);
    lastX.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const amenities = (hall?.amenities as string[]) || [];
  const images = (hall?.images as string[]) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 container mx-auto px-4">
          <Skeleton className="h-[500px] w-full rounded-2xl mb-8" />
          <Skeleton className="h-12 w-1/2 mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">Venue Not Found</h1>
          <Button variant="outline" asChild>
            <Link to="/halls">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Venues
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20">
        {/* 360 Panorama Section */}
        <section 
          id="tour"
          className="relative h-[500px] overflow-hidden cursor-grab active:cursor-grabbing"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-100"
            style={{
              backgroundImage: `url('${hall.panorama_url || images[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920'}')`,
              backgroundPosition: `${50 + rotation * 0.5}% 50%`,
              backgroundSize: '200% 100%',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Panorama Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRotating(!isRotating)}
              className="glass border-0"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${isRotating ? 'animate-spin' : ''}`} />
              {isRotating ? 'Stop' : 'Auto Rotate'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="glass border-0"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          </div>

          {/* 360 Badge */}
          <div className="absolute top-6 left-6 px-4 py-2 rounded-full bg-secondary/90 text-secondary-foreground text-sm font-semibold">
            360° Virtual Tour
          </div>

          {/* Back Button */}
          <Button
            variant="ghost"
            className="absolute top-6 right-6 text-white hover:bg-white/20"
            asChild
          >
            <Link to="/halls">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </section>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
                  {hall.name}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {hall.description}
                </p>
              </div>

              {/* Image Gallery */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl font-semibold">Gallery</h3>
                  <div className="relative">
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <img
                        src={images[currentImageIndex]}
                        alt={`${hall.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 glass border-0"
                          onClick={() => setCurrentImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 glass border-0"
                          onClick={() => setCurrentImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex ? 'border-secondary' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <Check className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <div className="luxury-card p-6 sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting from</p>
                    <p className="text-3xl font-serif font-bold text-foreground">
                      ${hall.price_per_hour}
                      <span className="text-base font-normal text-muted-foreground">/hr</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {hall.capacity} guests
                  </Badge>
                </div>

                <div className="space-y-3 py-4 border-y">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Minimum booking</span>
                    <span className="font-medium">4 hours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deposit required</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cancellation</span>
                    <span className="font-medium">48 hours notice</span>
                  </div>
                </div>

                {user ? (
                  <Button variant="gold" size="lg" className="w-full" asChild>
                    <Link to={`/book?hall=${hall.id}`}>
                      Book This Venue
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button variant="gold" size="lg" className="w-full" asChild>
                      <Link to="/login">
                        Sign In to Book
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-primary underline">
                        Register here
                      </Link>
                    </p>
                  </div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  No payment required until booking is approved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
