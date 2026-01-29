
import HeroSection from "@/components/ui/HeroSection1";
import VenuesSection from "@/components/ui/VenuesSection";
import FeaturesSection from "@/components/ui/FeaturesSection";
import BookingStepsSection from "@/components/ui/BookingStepsSection";
import CTASection from "@/components/ui/CTASection";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <VenuesSection />
      <FeaturesSection />
      <BookingStepsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
