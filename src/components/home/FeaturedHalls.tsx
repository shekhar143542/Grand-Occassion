import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BanquetHall } from '@/lib/types';
import { HallPreviewCard } from './HallPreviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export function FeaturedHalls() {
  const { data: halls, isLoading } = useQuery({
    queryKey: ['featured-halls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banquet_halls')
        .select('*')
        .eq('is_active', true)
        .limit(4);

      if (error) throw error;
      return data as BanquetHall[];
    },
  });

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Featured Venues
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Discover Our Elegant Spaces
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each venue is thoughtfully designed to create the perfect atmosphere 
            for your special occasion, from intimate gatherings to grand celebrations.
          </p>
        </div>

        {/* Halls Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="luxury-card overflow-hidden">
                <Skeleton className="h-64 w-full" />
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))
          ) : (
            halls?.map((hall) => (
              <HallPreviewCard key={hall.id} hall={hall} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
