import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const TextareaGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Textarea {...props} />
  </div>
);

const MultiSelectGroup = ({ label, options, selectedOptions, onChange }) => {
  const handleToggle = option => {
    const newSelection = selectedOptions.includes(option) ? selectedOptions.filter(item => item !== option) : [...selectedOptions, option];
    onChange(newSelection);
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <Button key={option} variant={selectedOptions.includes(option) ? "default" : "outline"} onClick={() => handleToggle(option)} size="sm">
            {selectedOptions.includes(option) && <Check className="w-4 h-4 mr-2" />}
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

const Step3_Details = ({ formData, handleChange, handleAutoSave }) => {
  const handleHighlightsChange = e => {
    handleChange('highlights', e.target.value);
  };
  const handleHighlightsBlur = e => {
    handleAutoSave({ highlights: e.target.value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Details</h2>
      <p className="text-muted-foreground">Provide more details about your tool's capabilities and requirements.</p>
      <TextareaGroup label="Features" placeholder="List the main features of your tool, one per line." value={formData.features || ''} onChange={e => handleChange('features', e.target.value)} onBlur={e => handleAutoSave({ features: e.target.value })} />
      <TextareaGroup label="Highlights or Capabilities (one per line)" value={formData.highlights || ''} onChange={handleHighlightsChange} onBlur={handleHighlightsBlur} />
      <MultiSelectGroup 
        label="Platform Compatibility" 
        options={["Web", "Android", "iOS", "Windows", "macOS", "API", "Other"]} 
        selectedOptions={formData.platform_compatibility || []} 
        onChange={selected => {
          handleChange('platform_compatibility', selected);
          handleAutoSave({ platform_compatibility: selected });
        }} 
      />
      <TextareaGroup 
        label="Dependencies (one per line)" 
        value={Array.isArray(formData.dependencies) ? formData.dependencies.join('\n') : (formData.dependencies || '')} 
        onChange={e => handleChange('dependencies', e.target.value.split('\n'))} 
        onBlur={e => handleAutoSave({ dependencies: e.target.value.split('\n').filter(Boolean) })} 
      />
    </div>
  );
};

export default Step3_Details;