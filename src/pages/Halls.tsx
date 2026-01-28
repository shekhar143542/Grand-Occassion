import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BanquetHall } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { HallPreviewCard } from '@/components/home/HallPreviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Building2 } from 'lucide-react';

export default function HallsPage() {
  const { data: halls, isLoading } = useQuery({
    queryKey: ['all-halls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banquet_halls')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as BanquetHall[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            Our Venues
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explore Our Stunning Venues
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From grand ballrooms to intimate garden spaces, discover the perfect 
            venue for your celebration. Each space is designed to create unforgettable memories.
          </p>
        </div>
      </section>

      {/* Halls Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="luxury-card overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : halls && halls.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {halls.map((hall) => (
                <HallPreviewCard key={hall.id} hall={hall} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Sparkles className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                No Venues Available
              </h3>
              <p className="text-muted-foreground">
                Please check back soon for our stunning venue collection.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
