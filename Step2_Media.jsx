import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Paperclip, FileVideo, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const TextareaGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Textarea {...props} />
  </div>
);

const Step2_Media = ({ formData, handleChange, handleAutoSave, toolId }) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleMediaUpload = async e => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const uploads = files.map(async file => {
      const filePath = `tool_media/${toolId}/screenshots/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('agentor_tools').upload(filePath, file);
      if (uploadError) {
        toast({ title: `Upload failed for ${file.name}`, description: uploadError.message, variant: "destructive" });
        return null;
      }
      const { data: { publicUrl } } = supabase.storage.from('agentor_tools').getPublicUrl(filePath);
      return publicUrl;
    });
    const newUrls = (await Promise.all(uploads)).filter(Boolean);
    const updatedMediaUrls = [...(formData.media_urls || []), ...newUrls];
    handleChange('media_urls', updatedMediaUrls);
    await handleAutoSave({ media_urls: updatedMediaUrls });
    setUploading(false);
  };

  const removeMedia = async (urlToRemove) => {
    const updatedMediaUrls = formData.media_urls.filter(url => url !== urlToRemove);
    handleChange('media_urls', updatedMediaUrls);
    await handleAutoSave({ media_urls: updatedMediaUrls });
  };

  const getFileIcon = (url) => {
    const fileType = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (['mp4', 'webm', 'mov'].includes(fileType)) return <FileVideo className="w-8 h-8 text-green-500" />;
    return <Paperclip className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Media & Integrations</h2>
      <p className="text-muted-foreground">Showcase your tool and list any required integrations.</p>
      
      <div>
        <Label htmlFor="media-upload">Upload Screenshots</Label>
        <Input id="media-upload" type="file" multiple className="hidden" onChange={handleMediaUpload} accept="image/*,video/*" />
        <label htmlFor="media-upload" className="mt-2 border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer block">
          {uploading ? <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div> : <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />}
          <p>{uploading ? "Uploading..." : "Click or drag files to upload"}</p>
        </label>
      </div>
      
      {formData.media_urls?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Uploaded Files</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formData.media_urls.map((url, index) => (
              <li key={index} className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-lg flex items-center justify-between gap-3">
                {getFileIcon(url)}
                <span className="truncate text-sm flex-1">{url.split('/').pop()}</span>
                <Button size="icon" variant="ghost" onClick={() => removeMedia(url)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <TextareaGroup label="Integration" placeholder="List integrations or APIs needed, one per line." value={formData.integrations || ''} onChange={e => handleChange('integrations', e.target.value)} onBlur={e => handleAutoSave({ integrations: e.target.value })} />
    </div>
  );
};

export default Step2_Media;