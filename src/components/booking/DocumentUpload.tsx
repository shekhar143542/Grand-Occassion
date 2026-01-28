import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { documentTypes } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Loader2, Check, X } from 'lucide-react';

interface DocumentUploadProps {
  bookingId: string;
  onUploadComplete?: () => void;
}

interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  status: 'uploading' | 'success' | 'error';
}

export function DocumentUpload({ bookingId, onUploadComplete }: DocumentUploadProps) {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !documentType) {
      toast({
        title: 'Select document type',
        description: 'Please select the type of document before uploading.',
        variant: 'destructive',
      });
      return;
    }

    const docId = crypto.randomUUID();
    setUploadedDocs(prev => [...prev, {
      id: docId,
      name: file.name,
      type: documentType,
      status: 'uploading',
    }]);
    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${bookingId}/${documentType}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('booking-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('booking-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: docError } = await supabase
        .from('booking_documents')
        .insert({
          booking_id: bookingId,
          document_type: documentType,
          document_name: file.name,
          file_url: urlData.publicUrl,
          status: 'pending',
        });

      if (docError) throw docError;

      setUploadedDocs(prev =>
        prev.map(d => (d.id === docId ? { ...d, status: 'success' } : d))
      );

      toast({
        title: 'Document uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });

      onUploadComplete?.();
    } catch (error: any) {
      setUploadedDocs(prev =>
        prev.map(d => (d.id === docId ? { ...d, status: 'error' } : d))
      );

      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setDocumentType('');
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label htmlFor="doc-type" className="sr-only">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger id="doc-type">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleUpload}
            disabled={uploading || !documentType}
            className="hidden"
            id="doc-upload"
          />
          <Button
            variant="secondary"
            disabled={uploading || !documentType}
            asChild
          >
            <label htmlFor="doc-upload" className="cursor-pointer">
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Document
            </label>
          </Button>
        </div>
      </div>

      {uploadedDocs.length > 0 && (
        <div className="space-y-2">
          {uploadedDocs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {documentTypes.find(t => t.value === doc.type)?.label}
                </p>
              </div>
              {doc.status === 'uploading' && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {doc.status === 'success' && (
                <Check className="h-4 w-4 text-green-500" />
              )}
              {doc.status === 'error' && (
                <X className="h-4 w-4 text-red-500" />
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Accepted formats: PDF, JPG, PNG, WebP. Max size: 10MB per file.
      </p>
    </div>
  );
}
