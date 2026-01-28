import { Search, Calendar, CreditCard, PartyPopper } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Explore & Choose',
    description: 'Browse our collection of stunning venues with 360° virtual tours.',
  },
  {
    icon: Calendar,
    title: 'Select Date & Time',
    description: 'Pick your perfect date and customize your event requirements.',
  },
  {
    icon: CreditCard,
    title: 'Confirm & Pay',
    description: 'Complete your booking with our secure payment process.',
  },
  {
    icon: PartyPopper,
    title: 'Celebrate!',
    description: 'Arrive and enjoy your perfectly planned event with us.',
  },
];

export function ProcessSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Book your dream venue in just a few simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-border via-secondary/50 to-border" />
              )}

              {/* Icon */}
              <div className="relative z-10 mx-auto w-24 h-24 rounded-full bg-card border-2 border-secondary/20 flex items-center justify-center mb-6 transition-all duration-300 group-hover:border-secondary group-hover:shadow-gold">
                <step.icon className="h-10 w-10 text-secondary" />
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
