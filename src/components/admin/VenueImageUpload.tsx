import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image, View, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VenueImageUploadProps {
  type: 'gallery' | 'panorama';
  existingImages?: string[];
  existingPanorama?: string;
  onImagesChange: (images: string[]) => void;
  onPanoramaChange?: (url: string) => void;
}

export function VenueImageUpload({
  type,
  existingImages = [],
  existingPanorama = '',
  onImagesChange,
  onPanoramaChange,
}: VenueImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);
  const [panoramaUrl, setPanoramaUrl] = useState(existingPanorama);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not an image file.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds the 10MB limit.`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${type}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('venue-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('venue-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        if (type === 'panorama') {
          const newPanorama = uploadedUrls[0];
          setPanoramaUrl(newPanorama);
          onPanoramaChange?.(newPanorama);
        } else {
          const newImages = [...images, ...uploadedUrls];
          setImages(newImages);
          onImagesChange(newImages);
        }

        toast({
          title: 'Upload successful',
          description: `${uploadedUrls.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading images.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid image URL.',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'panorama') {
      setPanoramaUrl(urlInput);
      onPanoramaChange?.(urlInput);
    } else {
      const newImages = [...images, urlInput];
      setImages(newImages);
      onImagesChange(newImages);
    }

    setUrlInput('');
    toast({
      title: 'URL added',
      description: 'Image URL has been added successfully.',
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleRemovePanorama = () => {
    setPanoramaUrl('');
    onPanoramaChange?.('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {type === 'panorama' ? (
          <View className="h-4 w-4 text-purple-500" />
        ) : (
          <Image className="h-4 w-4 text-muted-foreground" />
        )}
        <Label className="font-medium">
          {type === 'panorama' ? '360° Panorama Image' : 'Gallery Images'}
        </Label>
        <span className="text-xs text-muted-foreground">(optional)</span>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={type === 'gallery'}
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={uploading}
          />
        </TabsContent>

        <TabsContent value="url" className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <Button type="button" onClick={handleAddUrl}>
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter an image URL and click Add
          </p>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      {type === 'panorama' && panoramaUrl && (
        <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
          <img
            src={panoramaUrl}
            alt="360° Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleRemovePanorama}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-2 bg-purple-500/80 text-white text-xs px-2 py-1 rounded">
            360° Panorama
          </div>
        </div>
      )}

      {type === 'gallery' && images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted group"
            >
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
