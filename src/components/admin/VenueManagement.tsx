import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BanquetHall } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { VenueImageUpload } from './VenueImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  IndianRupee,
  Image,
  View,
} from 'lucide-react';

interface VenueFormData {
  name: string;
  description: string;
  capacity: number;
  price_per_hour: number;
  amenities: string;
  images: string[];
  panorama_url: string;
  is_active: boolean;
}

const initialFormData: VenueFormData = {
  name: '',
  description: '',
  capacity: 100,
  price_per_hour: 1000,
  amenities: '',
  images: [],
  panorama_url: '',
  is_active: true,
};

export function VenueManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<BanquetHall | null>(null);
  const [deletingVenue, setDeletingVenue] = useState<BanquetHall | null>(null);
  const [formData, setFormData] = useState<VenueFormData>(initialFormData);

  const { data: venues, isLoading } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banquet_halls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BanquetHall[];
    },
  });

  const saveVenue = useMutation({
    mutationFn: async (data: VenueFormData) => {
      const venueData = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        capacity: data.capacity,
        price_per_hour: data.price_per_hour,
        amenities: data.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        images: data.images.filter(Boolean),
        panorama_url: data.panorama_url.trim() || null,
        is_active: data.is_active,
      };

      if (editingVenue) {
        const { error } = await supabase
          .from('banquet_halls')
          .update(venueData)
          .eq('id', editingVenue.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banquet_halls').insert(venueData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      queryClient.invalidateQueries({ queryKey: ['all-halls'] });
      queryClient.invalidateQueries({ queryKey: ['featured-halls'] });
      toast({
        title: editingVenue ? 'Venue updated' : 'Venue created',
        description: `${formData.name} has been ${editingVenue ? 'updated' : 'added'} successfully.`,
      });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save venue',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteVenue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banquet_halls').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      queryClient.invalidateQueries({ queryKey: ['all-halls'] });
      queryClient.invalidateQueries({ queryKey: ['featured-halls'] });
      toast({
        title: 'Venue deleted',
        description: 'The venue has been removed.',
      });
      setDeleteDialogOpen(false);
      setDeletingVenue(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete venue',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const openCreateDialog = () => {
    setEditingVenue(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (venue: BanquetHall) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description || '',
      capacity: venue.capacity,
      price_per_hour: venue.price_per_hour,
      amenities: venue.amenities.join(', '),
      images: venue.images || [],
      panorama_url: venue.panorama_url || '',
      is_active: venue.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingVenue(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Venue name is required.',
        variant: 'destructive',
      });
      return;
    }
    saveVenue.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">Venue Management</h2>
          <p className="text-muted-foreground">Add and manage banquet halls with 360° views</p>
        </div>

        <Button variant="gold" onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Venue
        </Button>
      </div>

      {/* Venue List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : venues?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No venues added yet</p>
          <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first venue
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {venues?.map((venue) => (
            <div key={venue.id} className="luxury-card overflow-hidden">
              {/* Image Preview */}
              <div className="relative h-40 bg-muted">
                {venue.images.length > 0 ? (
                  <img
                    src={venue.images[0]}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={venue.is_active ? 'default' : 'secondary'}>
                    {venue.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {venue.panorama_url && (
                    <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                      <View className="h-3 w-3 mr-1" />
                      360°
                    </Badge>
                  )}
                </div>
              </div>

              {/* Venue Info */}
              <div className="p-4">
                <h3 className="font-serif text-lg font-semibold mb-2">{venue.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {venue.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{venue.capacity} guests</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span>{venue.price_per_hour}/hr</span>
                  </div>
                </div>

                {/* Amenities */}
                {venue.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {venue.amenities.slice(0, 3).map((amenity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {venue.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{venue.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(venue)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeletingVenue(venue);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
            <DialogDescription>
              {editingVenue
                ? 'Update venue details and 360° panorama view.'
                : 'Add a new banquet hall with images and 360° panorama view.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="The Grand Ballroom"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })
                    }
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="price">Price/Hour (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_per_hour}
                    onChange={(e) =>
                      setFormData({ ...formData, price_per_hour: parseInt(e.target.value) || 0 })
                    }
                    placeholder="1500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A beautiful and elegant venue perfect for weddings and corporate events..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="AC, Sound System, LED Walls, Catering, Valet Parking"
              />
            </div>

            {/* Gallery Images Upload */}
            <VenueImageUpload
              type="gallery"
              existingImages={formData.images}
              onImagesChange={(images) => setFormData({ ...formData, images })}
            />

            {/* 360° Panorama Upload */}
            <VenueImageUpload
              type="panorama"
              existingPanorama={formData.panorama_url}
              onImagesChange={() => {}}
              onPanoramaChange={(url) => setFormData({ ...formData, panorama_url: url })}
            />

            <div className="flex items-center justify-between">
              <div>
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive venues won't appear on the public venues page
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveVenue.isPending}>
              {saveVenue.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingVenue ? 'Update Venue' : 'Add Venue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-medium">{deletingVenue?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVenue && deleteVenue.mutate(deletingVenue.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVenue.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Venue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
