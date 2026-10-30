import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

import Step1_BasicInfo from './add-tool/Step1_BasicInfo';
import Step2_Media from './add-tool/Step2_Media';
import Step3_Details from './add-tool/Step3_Details';
import Step4_Pricing from './add-tool/Step4_Pricing';
import Step5_Review from './add-tool/Step5_Review';

const steps = [
  { id: 1, title: 'Basic info' },
  { id: 2, title: 'Media & Files' },
  { id: 3, title: 'Details' },
  { id: 4, title: 'Pricing model' },
  { id: 5, title: 'Review & publish' },
];

const MultiStepForm = ({ user, toolId, onBack, onPublishSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchToolData = async () => {
      if (toolId) {
        setLoading(true);
        const { data, error } = await supabase.from('tools').select('*').eq('id', toolId).single();
        if (error) {
          toast({ title: 'Error fetching tool data', description: error.message, variant: 'destructive' });
        } else {
          setFormData(data || {});
        }
        setLoading(false);
      }
    };
    fetchToolData();
  }, [toolId, toast]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutoSave = async (updateData) => {
    setIsSaving(true);
    const dataToSave = { ...updateData, updated_at: new Date().toISOString() };
    if (updateData.name) dataToSave.title = updateData.name;

    const { error } = await supabase.from('tools').update(dataToSave).eq('id', toolId);
    if (error) {
      toast({ title: 'Auto-save failed', description: error.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const validateStep1 = () => {
    const requiredFields = ['name', 'logo_url', 'category', 'problem_solved', 'description', 'public_url'];
    for (const field of requiredFields) {
      if (!formData[field]) return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast({ title: 'Incomplete Information', description: 'Please fill all required fields: Name, Logo, Category, Problem Solved, Description, and URL.', variant: 'destructive' });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handlePublish = async () => {
    if (!validateStep1()) {
      toast({ title: 'Cannot Publish', description: 'Missing required fields. Please complete all required fields before publishing.', variant: 'destructive' });
      setCurrentStep(1);
      return;
    }
    const { error } = await supabase.from('tools').update({ published: true, updated_at: new Date().toISOString() }).eq('id', toolId);
    if (error) {
      toast({ title: 'Publish failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Congratulations!', description: 'Your tool has been published successfully.' });
      onPublishSuccess();
    }
  };

  if (loading) return <div className="text-center p-8">Loading form...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <Button onClick={onBack} variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to My Creations</Button>
      <div className="bg-white dark:glass-card rounded-2xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map(step => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${currentStep >= step.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'}`}>
                    {currentStep > step.id ? <Check size={16} /> : step.id}
                  </div>
                  <div className="mt-2 text-center hidden md:block">
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                  </div>
                </div>
                {step.id < 5 && <div className={`flex-1 h-px transition-colors ${currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-zinc-700'} mx-4`}></div>}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && <Step1_BasicInfo formData={formData} handleChange={handleChange} handleAutoSave={handleAutoSave} toolId={toolId} />}
        {currentStep === 2 && <Step2_Media formData={formData} handleChange={handleChange} handleAutoSave={handleAutoSave} toolId={toolId} />}
        {currentStep === 3 && <Step3_Details formData={formData} handleChange={handleChange} handleAutoSave={handleAutoSave} />}
        {currentStep === 4 && <Step4_Pricing formData={formData} handleChange={handleChange} handleAutoSave={handleAutoSave} />}
        {currentStep === 5 && <Step5_Review formData={formData} onEdit={setCurrentStep} />}

        <div className="mt-8 flex justify-between items-center">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>Previous</Button>
          {isSaving && <span className="text-sm text-muted-foreground animate-pulse">Saving...</span>}
          {currentStep < 5 ? <Button onClick={nextStep}>Next</Button> : <Button onClick={handlePublish} className="bg-green-500 hover:bg-green-600">Publish</Button>}
        </div>
      </div>
    </div>
  );
};

const AddTool = ({ user, onPublishSuccess, onEditRequest }) => {
  const [showForm, setShowForm] = useState(false);
  const [toolId, setToolId] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);
  const { toast } = useToast();

  const fetchDrafts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tools').select('*').eq('created_by', user.id).eq('published', false).order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching drafts', description: error.message, variant: 'destructive' });
    } else {
      setDrafts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleAddNewTool = async () => {
    const draftName = 'New Draft Tool';
    const { data, error } = await supabase.from('tools').insert({
      created_by: user.id,
      name: draftName,
      title: draftName,
      description: ' ',
      published: false
    }).select().single();
    if (error) {
      toast({ title: 'Error creating draft', description: error.message, variant: 'destructive' });
    } else {
      setToolId(data.id);
      setShowForm(true);
      fetchDrafts();
    }
  };

  const handleEditDraft = draftId => {
    setToolId(draftId);
    setShowForm(true);
  };

  const handleDeleteRequest = draft => {
    setToolToDelete(draft);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toolToDelete) return;
    const { error: dbError } = await supabase.from('tools').delete().eq('id', toolToDelete.id);
    if (dbError) {
      toast({ title: 'Error deleting tool', description: dbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tool Deleted', description: `"${toolToDelete.name}" has been permanently deleted.` });
      fetchDrafts();
    }
    setShowDeleteConfirm(false);
    setToolToDelete(null);
  };

  const handleBackFromForm = () => {
    setShowForm(false);
    setToolId(null);
    fetchDrafts();
  };

  const handlePublishAndClose = () => {
    setShowForm(false);
    setToolId(null);
    onPublishSuccess();
  };

  useEffect(() => {
    if (onEditRequest) {
      handleEditDraft(onEditRequest);
    }
  }, [onEditRequest]);

  if (showForm) {
    return <MultiStepForm user={user} toolId={toolId} onBack={handleBackFromForm} onPublishSuccess={handlePublishAndClose} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Creations</h1>
            <p className="text-muted-foreground">Manage your tool drafts or create a new one.</p>
          </div>
          <Button onClick={handleAddNewTool} size="lg">
            <Plus className="mr-2" /> Add New Tool
          </Button>
        </div>
        {loading ? <p>Loading drafts...</p> : drafts.length > 0 ? (
          <div className="space-y-4">
            {drafts.map(draft => (
              <div key={draft.id} className="bg-white dark:glass-card p-4 rounded-lg flex justify-between items-center">
                <div onClick={() => handleEditDraft(draft.id)} className="cursor-pointer flex-grow">
                  <h3 className="font-semibold">{draft.name}</h3>
                  <p className="text-sm text-muted-foreground">Last updated: {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" onClick={() => handleEditDraft(draft.id)}>Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(draft)}>
                  <Trash2 className="w-5 h-5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">You have no drafts. Click "Add New Tool" to get started.</p>
          </div>
        )}
      </motion.div>
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{toolToDelete?.name}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete Tool</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddTool;