import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const InputGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Input {...props} />
  </div>
);

const TextareaGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Textarea {...props} />
  </div>
);

const SelectGroup = ({ label, options, ...props }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-zinc-800" {...props}>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const Step1_BasicInfo = ({ formData, handleChange, handleAutoSave, toolId }) => {
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [otherIndustry, setOtherIndustry] = useState('');

  const handleLogoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const filePath = `tool_media/${toolId}/logo.png`;
    const { error: uploadError } = await supabase.storage.from('agentor_tools').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Logo upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('agentor_tools').getPublicUrl(filePath);
    handleChange('logo_url', publicUrl);
    handleAutoSave({ logo_url: publicUrl });
  };

  const handleCategoryChange = e => {
    const value = e.target.value;
    if (value !== 'Other') {
      handleChange('category', value);
      handleAutoSave({ category: value });
    } else {
      handleChange('category', 'Other');
    }
  };

  const handleOtherCategoryBlur = e => {
    if (e.target.value) {
      handleAutoSave({ category: e.target.value });
    }
  };

  const handleIndustryChange = e => {
    const value = e.target.value;
    if (value !== 'Other') {
      handleChange('industry', value);
      handleAutoSave({ industry: value });
    } else {
      handleChange('industry', 'Other');
    }
  };

  const handleOtherIndustryBlur = e => {
    if (e.target.value) {
      handleAutoSave({ industry: e.target.value });
    }
  };

  const handleTagInput = (e) => {
    if (e.key === ' ' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !(formData.tags || []).includes(newTag)) {
        const newTags = [...(formData.tags || []), newTag];
        handleChange('tags', newTags);
        handleAutoSave({ tags: newTags });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    const newTags = (formData.tags || []).filter(tag => tag !== tagToRemove);
    handleChange('tags', newTags);
    handleAutoSave({ tags: newTags });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Basic Information</h2>
      <p className="text-muted-foreground">Tell us about your AI Tool. Fields with * are required.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Tool Logo/Icon*</Label>
          <Input id="logo-upload" type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
          <label htmlFor="logo-upload" className="w-24 h-24 bg-gray-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center cursor-pointer border-2 border-dashed hover:border-blue-500">
            {formData.logo_url ? <img src={formData.logo_url} alt="Tool logo" className="w-full h-full object-cover rounded-md" /> : <Upload />}
          </label>
        </div>
        <div className="md:col-span-2 space-y-6">
          <InputGroup label="Name of the Tool*" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} onBlur={e => handleAutoSave({ name: e.target.value })} />
          <InputGroup label="Short Tagline" value={formData.short_tagline || ''} onChange={e => handleChange('short_tagline', e.target.value)} onBlur={e => handleAutoSave({ short_tagline: e.target.value })} />
        </div>
      </div>
      
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap items-center gap-2 border p-2 rounded-md">
          {(formData.tags || []).map((tag, i) => 
            <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 border border-black dark:border-white text-black dark:text-white text-sm rounded-full flex items-center gap-1">
              {tag}
              <button onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-700">&times;</button>
            </span>
          )}
          <Input 
            placeholder="Add tags..." 
            className="flex-1 border-none outline-none focus:ring-0"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInput}
            onBlur={() => {
              if (tagInput.trim()) {
                const newTag = tagInput.trim();
                if (newTag && !(formData.tags || []).includes(newTag)) {
                  const newTags = [...(formData.tags || []), newTag];
                  handleChange('tags', newTags);
                  handleAutoSave({ tags: newTags });
                }
                setTagInput('');
              }
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SelectGroup label="Industry*" value={formData.industry !== 'Other' ? formData.industry : 'Other'} onChange={handleIndustryChange} options={['AI', 'Marketing', 'Productivity', 'Development', 'Design', 'Education', 'Other']} />
          {formData.industry === 'Other' && <Input className="mt-2" placeholder="Type your industry" value={otherIndustry} onChange={e => setOtherIndustry(e.target.value)} onBlur={handleOtherIndustryBlur} />}
        </div>
        <div>
          <SelectGroup label="Category*" value={formData.category !== 'Other' ? formData.category : 'Other'} onChange={handleCategoryChange} options={['Chatbot', 'Agent', 'Tool', 'Other']} />
          {formData.category === 'Other' && <Input className="mt-2" placeholder="Type your category" value={otherCategory} onChange={e => setOtherCategory(e.target.value)} onBlur={handleOtherCategoryBlur} />}
        </div>
      </div>
      <TextareaGroup label="Full Description*" value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} onBlur={e => handleAutoSave({ description: e.target.value })} />
      <TextareaGroup label="What problem this tool gonna solve*" placeholder="Describe what problem this tool solves for users." value={formData.problem_solved || ''} onChange={e => handleChange('problem_solved', e.target.value)} onBlur={e => handleAutoSave({ problem_solved: e.target.value })} />
      <InputGroup label="URL Link*" value={formData.public_url || ''} onChange={e => handleChange('public_url', e.target.value)} onBlur={e => handleAutoSave({ public_url: e.target.value })} />
    </div>
  );
};

export default Step1_BasicInfo;