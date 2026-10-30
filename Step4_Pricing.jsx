import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const InputGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Input {...props} />
  </div>
);

const Step4_Pricing = ({ formData, handleChange, handleAutoSave }) => {
  const plans = formData.plans || [{ name: '', price: '', duration: 'monthly', description: '' }];

  const handlePlanChange = (index, field, value) => {
    const newPlans = [...plans];
    newPlans[index][field] = value;
    handleChange('plans', newPlans);
  };

  const addPlan = () => handleChange('plans', [...plans, { name: '', price: '', duration: 'monthly', description: '' }]);
  const removePlan = index => handleChange('plans', plans.filter((_, i) => i !== index));
  const savePlans = () => handleAutoSave({ plans: plans });

  const handlePricingTypeSave = type => {
    handleChange('pricing_type', type);
    handleAutoSave({ pricing_type: type });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Pricing and Plan</h2>
      <div className="flex gap-4">
        <Button variant={formData.pricing_type === 'free' ? 'default' : 'outline'} onClick={() => handlePricingTypeSave('free')}>Free</Button>
        <Button variant={formData.pricing_type === 'one_time' ? 'default' : 'outline'} onClick={() => handlePricingTypeSave('one_time')}>One-Time Purchase</Button>
        <Button variant={formData.pricing_type === 'subscription' ? 'default' : 'outline'} onClick={() => handlePricingTypeSave('subscription')}>Subscription</Button>
      </div>
      {formData.pricing_type === 'one_time' && (
        <InputGroup label="Price (INR)" type="number" value={formData.price || ''} onChange={e => handleChange('price', e.target.value)} onBlur={e => handleAutoSave({ price: e.target.value })} />
      )}
      {formData.pricing_type === 'subscription' && (
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-2 relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removePlan(index)}><Trash2 size={16} /></Button>
              <Input placeholder="Plan Name" value={plan.name} onChange={e => handlePlanChange(index, 'name', e.target.value)} onBlur={savePlans} />
              <Input placeholder="Price (INR)" type="number" value={plan.price} onChange={e => handlePlanChange(index, 'price', e.target.value)} onBlur={savePlans} />
              <select value={plan.duration} onChange={e => handlePlanChange(index, 'duration', e.target.value)} onBlur={savePlans} className="w-full p-2 border rounded bg-transparent dark:bg-zinc-800">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <Textarea placeholder="Description" value={plan.description} onChange={e => handlePlanChange(index, 'description', e.target.value)} onBlur={savePlans} />
            </div>
          ))}
          <Button variant="outline" onClick={addPlan}><Plus className="mr-2" /> Add Plan</Button>
        </div>
      )}
    </div>
  );
};

export default Step4_Pricing;