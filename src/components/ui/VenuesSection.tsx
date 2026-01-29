import { ArrowRight, Users, Square, Star } from "lucide-react";
import venueIntimate from "@/assets/venue-intimate.jpg";
import venueCorporate from "@/assets/venue-corporate.jpg";
import venueWedding from "@/assets/venue-wedding.jpg";

const venues = [
  {
    id: 1,
    name: "The Grand Ballroom",
    description: "Our signature venue for weddings and large celebrations",
    capacity: "500",
    area: "8,000 sq ft",
    image: venueWedding,
    features: ["Crystal Chandeliers", "Grand Stage", "Private Entrance"],
  },
  {
    id: 2,
    name: "The Ivory Hall",
    description: "Intimate setting for exclusive gatherings",
    capacity: "150",
    area: "3,000 sq ft",
    image: venueIntimate,
    features: ["Garden View", "Natural Light", "Private Bar"],
  },
  {
    id: 3,
    name: "The Executive Suite",
    description: "Perfect for corporate events and conferences",
    capacity: "300",
    area: "5,000 sq ft",
    image: venueCorporate,
    features: ["AV Equipment", "Breakout Rooms", "Business Center"],
  },
];

const VenuesSection = () => {
  return (
    <section id="venues" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-xs tracking-[0.4em] uppercase font-body mb-4">
            Our Venues
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Exceptional <span className="text-gold-gradient">Spaces</span>
          </h2>
          <div className="gold-line max-w-xs mx-auto mb-6" />
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            Each venue is meticulously designed to provide an unforgettable backdrop 
            for your most cherished moments.
          </p>
        </div>

        {/* Venues Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {venues.map((venue, index) => (
            <div
              key={venue.id}
              className="group relative bg-background border border-border rounded overflow-hidden hover:border-primary/50 transition-all duration-500"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={venue.image}
                  alt={venue.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-sm">
                  <Star size={12} className="text-primary fill-primary" />
                  <span className="text-xs font-body text-foreground">5.0</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-2xl text-foreground mb-2 group-hover:text-primary transition-colors">
                  {venue.name}
                </h3>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  {venue.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-6 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <span className="text-muted-foreground">{venue.capacity} Guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square size={14} className="text-primary" />
                    <span className="text-muted-foreground">{venue.area}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {venue.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs font-body px-3 py-1 bg-muted text-muted-foreground rounded-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-primary text-sm font-body tracking-wider uppercase group-hover:gap-4 transition-all"
                >
                  View Details
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VenuesSection;
