import { Phone, Mail, MapPin } from "lucide-react";

const CTASection = () => {
  return (
    <section id="contact" className="py-24 bg-gold-subtle relative overflow-hidden">
      {/* Decorative Squares with Border Runner Animation */}
      <div className="absolute top-10 left-10 group">
        <div className="w-40 h-40 rotate-45 border-runner-container transition-all duration-500 hover:scale-[1.03] hover:shadow-gold">
          <div className="border-runner" />
        </div>
      </div>
      <div className="absolute bottom-10 right-10 group">
        <div className="w-32 h-32 -rotate-12 border-runner-container transition-all duration-500 hover:scale-[1.03] hover:shadow-gold">
          <div className="border-runner" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <span className="inline-block text-primary text-xs tracking-[0.4em] uppercase font-body mb-4">
            Start Your Journey
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Book Your <span className="text-gold-gradient">Dream Event</span>
          </h2>
          <div className="gold-line-animated max-w-xs mx-auto mb-6" />
          <p className="font-body text-muted-foreground max-w-xl mx-auto mb-12">
            Let our expert team help you create an unforgettable experience. 
            Contact us today for a personalized consultation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="btn-luxury-shimmer min-w-[220px]">
              <span>Schedule a Tour</span>
            </button>
            <button className="btn-luxury-shimmer min-w-[220px] btn-outline-shimmer">
              <span>Get a Quote</span>
            </button>
          </div>

          {/* Contact Info */}
          <div className="grid sm:grid-cols-3 gap-8 pt-12 border-t border-border">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border border-primary/30 rounded-full flex items-center justify-center">
                <Phone size={18} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Call Us
                </p>
                <a href="tel:+1234567890" className="font-display text-lg text-foreground hover:text-primary transition-colors">
                  +1 (234) 567-890
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border border-primary/30 rounded-full flex items-center justify-center">
                <Mail size={18} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Email Us
                </p>
                <a href="mailto:events@grandoccasion.com" className="font-display text-lg text-foreground hover:text-primary transition-colors">
                  events@grandoccasion.com
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border border-primary/30 rounded-full flex items-center justify-center">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Visit Us
                </p>
                <p className="font-display text-lg text-foreground">
                  123 Grand Avenue
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
