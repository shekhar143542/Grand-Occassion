import { Crown, Sparkles, Utensils, Music, Camera, Car } from "lucide-react";

const features = [
  {
    icon: Crown,
    title: "Premium Service",
    description: "Dedicated event managers ensure every detail is perfect",
  },
  {
    icon: Utensils,
    title: "Gourmet Catering",
    description: "World-class cuisine from our award-winning chefs",
  },
  {
    icon: Sparkles,
    title: "Elegant Decor",
    description: "Custom floral arrangements and themed decorations",
  },
  {
    icon: Music,
    title: "Entertainment",
    description: "State-of-the-art sound and lighting systems",
  },
  {
    icon: Camera,
    title: "Photography",
    description: "Professional photography and videography services",
  },
  {
    icon: Car,
    title: "Valet Parking",
    description: "Complimentary valet service for all guests",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
               backgroundSize: '50px 50px'
             }} 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-xs tracking-[0.4em] uppercase font-body mb-4">
            Why Choose Us
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Unmatched <span className="text-gold-gradient">Excellence</span>
          </h2>
          <div className="gold-line max-w-xs mx-auto mb-6" />
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            From the moment you step through our doors, experience service that goes 
            beyond expectations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-gold-lg hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-14 h-14 mb-6 border border-primary/30 rounded-xl flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                <feature.icon size={24} className="text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
