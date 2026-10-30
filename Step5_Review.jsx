import React from 'react';
import { Button } from '@/components/ui/button';

const PreviewSection = ({ title, onEdit, children }) => (
  <div className="border-t pt-4">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-semibold text-lg">{title}</h4>
      <Button variant="link" onClick={onEdit}>Edit</Button>
    </div>
    <div className="text-sm text-muted-foreground space-y-1">{children}</div>
  </div>
);

const Step5_Review = ({ formData, onEdit }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold">Review & Publish</h2>
    <p className="text-muted-foreground">Here's a preview of your tool. Go back to edit any details.</p>
    <div className="p-6 border rounded-lg bg-gray-50 dark:bg-zinc-800 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{formData.name || 'Tool Name'}</h3>
          <p className="text-muted-foreground">{formData.short_tagline || 'Short Tagline'}</p>
        </div>
        {formData.logo_url && <img src={formData.logo_url} alt="logo" className="w-16 h-16 rounded-md object-cover" />}
      </div>
      
      <PreviewSection title="Basic Info" onEdit={() => onEdit(1)}>
        <p><strong>Category:</strong> {formData.category || 'N/A'}</p>
        <p><strong>Industry:</strong> {formData.industry || 'N/A'}</p>
        <p><strong>Tags:</strong> {(formData.tags || []).join(', ') || 'N/A'}</p>
        <p><strong>Problem Solved:</strong> {formData.problem_solved || 'N/A'}</p>
        <p><strong>Full Description:</strong> {formData.description || 'N/A'}</p>
        <p><strong>URL Link:</strong> <a href={formData.public_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{formData.public_url || 'N/A'}</a></p>
      </PreviewSection>
      
      <PreviewSection title="Media & Integrations" onEdit={() => onEdit(2)}>
        <p><strong>Screenshots:</strong> {formData.media_urls?.length || 0} files uploaded.</p>
        <p><strong>Integration:</strong> {formData.integrations || 'N/A'}</p>
      </PreviewSection>

      <PreviewSection title="Details" onEdit={() => onEdit(3)}>
        <p><strong>Features:</strong> {formData.features || 'N/A'}</p>
        <p><strong>Highlights:</strong> {formData.highlights || 'N/A'}</p>
        <p><strong>Platform Compatibility:</strong> {(formData.platform_compatibility || []).join(', ') || 'N/A'}</p>
        <p><strong>Dependencies:</strong> {(Array.isArray(formData.dependencies) ? formData.dependencies.join(', ') : formData.dependencies) || 'N/A'}</p>
      </PreviewSection>

      <PreviewSection title="Pricing and Plan" onEdit={() => onEdit(4)}>
        <p><strong>Pricing Model:</strong> {formData.pricing_type || 'N/A'}</p>
        {formData.pricing_type === 'one_time' && <p><strong>Price:</strong> ₹{formData.price}</p>}
        {formData.pricing_type === 'subscription' && <p><strong>Plans:</strong> {formData.plans?.length || 0}</p>}
      </PreviewSection>
    </div>
  </div>
);

export default Step5_Review;