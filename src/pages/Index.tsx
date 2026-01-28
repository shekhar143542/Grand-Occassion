import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedHalls } from '@/components/home/FeaturedHalls';
import { ProcessSection } from '@/components/home/ProcessSection';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Phone, Mail, MapPin } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturedHalls />
      <ProcessSection />

      {/* CTA Section */}
      <section className="py-24 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Create Magic?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-10">
            Let us help you plan the perfect event. Our team is ready to bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/halls">Start Planning</Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-8 w-8 text-secondary" />
                <span className="font-serif text-2xl font-semibold">
                  Royal Banquets
                </span>
              </div>
              <p className="text-primary-foreground/70 mb-6 max-w-md">
                Creating unforgettable moments in our stunning venues since 2010. 
                From intimate gatherings to grand celebrations, we make every event special.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-primary-foreground/70">
                <li><Link to="/halls" className="hover:text-secondary transition-colors">Our Venues</Link></li>
                <li><Link to="/book" className="hover:text-secondary transition-colors">Book Now</Link></li>
                <li><Link to="/login" className="hover:text-secondary transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-secondary transition-colors">Register</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-serif text-lg font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-primary-foreground/70">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-secondary" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary" />
                  info@royalbanquets.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  123 Luxury Lane, NY 10001
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Royal Banquets. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
