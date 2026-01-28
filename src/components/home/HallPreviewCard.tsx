import { Link } from 'react-router-dom';
import { BanquetHall } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Users, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface HallPreviewCardProps {
  hall: BanquetHall;
}

export function HallPreviewCard({ hall }: HallPreviewCardProps) {
  const amenities = hall.amenities as string[];
  
  return (
    <div className="luxury-card group overflow-hidden">
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={hall.panorama_url || hall.images[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'}
          alt={hall.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full glass text-sm font-semibold text-foreground">
          ${hall.price_per_hour}/hr
        </div>

        {/* 360° Badge */}
        {hall.panorama_url && (
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-secondary/90 text-secondary-foreground text-xs font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            360° Tour
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
          {hall.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {hall.description}
        </p>

        {/* Details */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>Up to {hall.capacity} guests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>Min 4 hrs</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-6">
          {amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs"
            >
              {amenity}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
              +{amenities.length - 3} more
            </span>
          )}
        </div>

        {/* CTA */}
        <Button className="w-full group/btn" asChild>
          <Link to={`/halls/${hall.id}`}>
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
