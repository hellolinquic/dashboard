
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';

const ProfileView = () => {
  const { profile: initialProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);
  
  const handleSave = async () => {
    setLoading(true);
    if (!profile || !profile.id) {
      toast({ title: 'Error', description: 'Profile not loaded.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { id, created_at, updated_at, role, email, ...updateData } = profile;

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id);

    if (error) {
      toast({ title: 'Profile update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
      await refreshProfile();
    }
    setLoading(false);
  };

  const handleUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      let { error: uploadError } = await supabase.storage.from('agentor_tools').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('agentor_tools').getPublicUrl(filePath);

      const fieldToUpdate = profile.role === 'agentor' ? 'company_logo_url' : 'avatar_url';

      setProfile(prev => ({...prev, [fieldToUpdate]: publicUrl}));

    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive'});
    } finally {
      setUploading(false);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isAgentor = profile.role === 'agentor';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-500 dark:text-[#bfdbfe]">Update your personal and company information.</p>
      </div>
      
      <div className="bg-white dark:glass-card rounded-2xl p-8 space-y-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 text-4xl">
              <AvatarImage src={isAgentor ? profile.company_logo_url : profile.avatar_url} alt="Profile" />
              <AvatarFallback>{profile.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
              <Upload size={16} />
              <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold">{isAgentor ? profile.company_name || profile.name : profile.name}</h2>
            <p className="text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><Label htmlFor="name">Full Name</Label><Input id="name" name="name" value={profile.name || ''} onChange={handleChange} /></div>
          {isAgentor && <div><Label htmlFor="company_name">Company Name</Label><Input id="company_name" name="company_name" value={profile.company_name || ''} onChange={handleChange} /></div>}
        </div>
        
        {/* Bio Sections */}
        {!profile.age && !isAgentor && <AgenteeBioForm profile={profile} handleChange={handleChange} handleSave={handleSave} />}
        {!profile.experience_level && isAgentor && <AgentorBioForm profile={profile} handleChange={handleChange} handleSave={handleSave} />}
        
        {/* Location Section */}
        {!profile.country && !isAgentor && <LocationForm profile={profile} handleChange={handleChange} handleSave={handleSave} />}

        <div className="pt-6 border-t dark:border-zinc-700">
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save All Changes'}</Button>
        </div>
      </div>
    </motion.div>
  );
};

const AgenteeBioForm = ({ profile, handleChange, handleSave }) => (
  <div className="p-6 my-4 border rounded-lg dark:border-zinc-700">
    <h3 className="font-semibold text-lg mb-4">Tell us about yourself</h3>
    <div className="space-y-4">
      <div><Label htmlFor="age">Age</Label><Input id="age" name="age" type="number" value={profile.age || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="total_team_members">Total Team Members</Label><Input id="total_team_members" name="total_team_members" type="number" value={profile.total_team_members || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="problem_to_solve">What problem do you want to solve?</Label><Textarea id="problem_to_solve" name="problem_to_solve" value={profile.problem_to_solve || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="category">Specific Category of Tool</Label><Input id="category" name="category" value={profile.category || ''} onChange={handleChange} /></div>
      <Button onClick={handleSave}>Save Bio</Button>
    </div>
  </div>
);

const AgentorBioForm = ({ profile, handleChange, handleSave }) => (
  <div className="p-6 my-4 border rounded-lg dark:border-zinc-700">
    <h3 className="font-semibold text-lg mb-4">Tell us about your company</h3>
    <div className="space-y-4">
      <div><Label htmlFor="total_team_members">Total Team Members</Label><Input id="total_team_members" name="total_team_members" type="number" value={profile.total_team_members || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="profession_role">Your Profession and Role</Label><Input id="profession_role" name="profession_role" value={profile.profession_role || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="problem_to_solve">What problem will your company solve?</Label><Textarea id="problem_to_solve" name="problem_to_solve" value={profile.problem_to_solve || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="target_audience">Who is it for?</Label><Input id="target_audience" name="target_audience" value={profile.target_audience || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="experience_level">Your Experience Level</Label><Input id="experience_level" name="experience_level" value={profile.experience_level || ''} onChange={handleChange} /></div>
      <Button onClick={handleSave}>Save Bio</Button>
    </div>
  </div>
);

const LocationForm = ({ profile, handleChange, handleSave }) => (
  <div className="p-6 my-4 border rounded-lg dark:border-zinc-700">
    <h3 className="font-semibold text-lg mb-4">Where are you based?</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label htmlFor="country">Country</Label><Input id="country" name="country" value={profile.country || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="state">State</Label><Input id="state" name="state" value={profile.state || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="city">City</Label><Input id="city" name="city" value={profile.city || ''} onChange={handleChange} /></div>
      <div><Label htmlFor="pincode">Pincode</Label><Input id="pincode" name="pincode" value={profile.pincode || ''} onChange={handleChange} /></div>
    </div>
    <Button onClick={handleSave} className="mt-4">Save Location</Button>
  </div>
);

export default ProfileView;
