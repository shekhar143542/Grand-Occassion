import { Calendar, CheckCircle, CreditCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    icon: Calendar,
    title: "Request Booking",
    description: "Pick date/time, select halls, add details & amenities.",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Quick Verification",
    description: "Admins review documents + availability in minutes.",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Pay & Confirm",
    description: "Pay when requested and instantly download invoice & booking details.",
  },
];

const BookingStepsSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;

      // Calculate scroll progress within section
      const progress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight)));
      setScrollProgress(progress);

      // Determine active step based on progress
      if (progress < 0.33) setActiveStep(0);
      else if (progress < 0.66) setActiveStep(1);
      else setActiveStep(2);

      // Trigger step visibility with stagger
      const stepProgress = (windowHeight - sectionTop) / windowHeight;
      setVisibleSteps([
        stepProgress > 0.2,
        stepProgress > 0.35,
        stepProgress > 0.5,
      ]);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="inline-block text-primary text-xs tracking-[0.4em] uppercase font-body mb-4">
            How It Works
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
            Simple <span className="text-gold-gradient">Booking Process</span>
          </h2>
          <div className="gold-line max-w-xs mx-auto mb-6" />
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            Book your dream venue in three easy steps. Our streamlined process ensures a seamless experience from start to finish.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Timeline Line - Desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            {/* Background line */}
            <div className="absolute inset-0 bg-border" />
            {/* Animated gold fill */}
            <div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-primary to-primary/50 transition-all duration-500 ease-out"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid lg:grid-cols-1 gap-8 lg:gap-16">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative transition-all duration-700 ease-out ${
                  visibleSteps[index]
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Card with alternating layout on desktop */}
                <div
                  className={`lg:w-[45%] ${
                    index % 2 === 0 ? "lg:ml-0" : "lg:ml-auto"
                  }`}
                >
                  <div
                    className={`group relative p-8 bg-card border border-border rounded-2xl transition-all duration-500 cursor-pointer
                      hover:-translate-y-1.5 hover:border-primary/50
                      ${activeStep === index ? "border-primary/30 shadow-gold" : ""}
                    `}
                    style={{
                      boxShadow: activeStep === index ? "var(--shadow-gold)" : undefined,
                    }}
                  >
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Glow border effect on hover */}
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 pointer-events-none" />

                    <div className="relative z-10 flex items-start gap-6">
                      {/* Step Number Badge */}
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300
                          ${
                            activeStep === index
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                              : "border-primary/30 group-hover:border-primary group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                          }
                        `}
                      >
                        <span
                          className={`font-display text-lg transition-colors duration-300 ${
                            activeStep === index
                              ? "text-primary"
                              : "text-primary/60 group-hover:text-primary"
                          }`}
                        >
                          {step.number}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        {/* Icon */}
                        <div
                          className={`w-10 h-10 mb-4 rounded-lg border flex items-center justify-center transition-all duration-300
                            ${
                              activeStep === index
                                ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.2)]"
                                : "border-primary/20 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:shadow-[0_0_10px_hsl(var(--primary)/0.15)]"
                            }
                          `}
                        >
                          <step.icon
                            size={20}
                            className={`transition-all duration-300 ${
                              activeStep === index
                                ? "text-primary"
                                : "text-primary/60 group-hover:text-primary"
                            }`}
                          />
                        </div>

                        {/* Title */}
                        <h3 className="font-display text-xl md:text-2xl text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                          {step.title}
                        </h3>

                        {/* Description */}
                        <p className="font-body text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/70 transition-colors duration-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Dot - Desktop */}
                <div
                  className={`hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 items-center justify-center transition-all duration-500
                    ${
                      activeStep >= index
                        ? "border-primary bg-primary scale-110 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                        : "border-border bg-background"
                    }
                  `}
                >
                  {activeStep >= index && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Decorative Element */}
        <div className="mt-16 flex justify-center">
          <div className="gold-line w-32" />
        </div>
      </div>
    </section>
  );
};

export default BookingStepsSection;
