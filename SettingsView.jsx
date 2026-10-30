import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const SettingsView = ({ theme, toggleTheme }) => {
  const { profile } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);

  const [language, setLanguage] = useState('en');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [purchaseAlerts, setPurchaseAlerts] = useState(true);

  // Load user settings from Supabase
  useEffect(() => {
    if (!profile) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('auth_uid', profile.id)
        .single();

      if (!error && data) {
        setLanguage(data.language || 'en');
        setPaymentMethod(data.payment_method || '');
        setEmailNotifications(data.email_notifications);
        setPurchaseAlerts(data.purchase_alerts);
      }
    };

    fetchSettings();
  }, [profile]);

  // Save user settings
  const saveSetting = async (field, value) => {
    if (!profile) return;

    const payload = { auth_uid: profile.id, [field]: value, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'auth_uid' });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: `${field} updated successfully!` });
    }
  };

  // Handle Email update
  const handleEmailUpdate = async () => {
    if (!newEmail || newEmail === profile.email) {
      toast({ title: 'No changes to save.', variant: 'default' });
      return;
    }
    setLoadingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast({ title: 'Email update failed', description: error.message, variant: 'destructive' });
    } else {
      await supabase.from('profiles').update({ email: newEmail, updated_at: new Date().toISOString() }).eq('id', profile.id);
      toast({ title: 'Email Update Initiated', description: 'Check old/new inbox to confirm.' });
      setNewEmail('');
    }
    setLoadingEmail(false);
  };

  // Handle Phone update
  const handlePhoneUpdate = async () => {
    if (!newPhone || newPhone === profile.phone) {
      toast({ title: 'No changes to save.', variant: 'default' });
      return;
    }
    setLoadingPhone(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone: newPhone, phone_verified: false, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (error) {
      toast({ title: 'Phone update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Phone Updated', description: 'Re-verify your phone in profile.' });
      setNewPhone('');
    }
    setLoadingPhone(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-[#bfdbfe]">Manage your account and preferences.</p>
        </div>

        <div className="bg-white dark:glass-card rounded-2xl p-8 space-y-8">

          {/* Account Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Account</h3>
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-end gap-4">
                <div className="flex-grow">
                  <Label htmlFor="email" className="text-gray-700 dark:text-white">Update Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder={profile?.email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <ConfirmDialog triggerText={loadingEmail ? 'Saving...' : 'Save Email'} onConfirm={handleEmailUpdate} title="Update Email?" description={`Change email to ${newEmail}?`} disabled={loadingEmail || !newEmail || newEmail === profile.email} />
              </div>

              {/* Phone */}
              <div className="flex items-end gap-4">
                <div className="flex-grow">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-white">Update Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder={profile?.phone || 'Not set'} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <ConfirmDialog triggerText={loadingPhone ? 'Saving...' : 'Save Phone'} onConfirm={handlePhoneUpdate} title="Update Phone?" description={`Change phone to ${newPhone}?`} disabled={loadingPhone || !newPhone || newPhone === profile.phone} />
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Theme</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-switch" className="text-gray-700 dark:text-white">Toggle light/dark mode</Label>
              <div className="flex items-center gap-2">
                <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-yellow-500' : 'text-gray-400'}`} />
                <Switch id="theme-switch" checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-gray-700 dark:text-white">Email notifications</Label>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={(val) => { setEmailNotifications(val); saveSetting('email_notifications', val); }} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="purchase-alerts" className="text-gray-700 dark:text-white">Purchase alerts</Label>
                <Switch id="purchase-alerts" checked={purchaseAlerts} onCheckedChange={(val) => { setPurchaseAlerts(val); saveSetting('purchase_alerts', val); }} />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Additional Preferences</h3>
            <div className="space-y-4">
              {/* Language Selector */}
              <div>
                <Label htmlFor="language" className="text-gray-700 dark:text-white">Language</Label>
                <select id="language" value={language} onChange={(e) => { setLanguage(e.target.value); saveSetting('language', e.target.value); }} className="mt-1 w-full p-2 rounded-lg bg-white/10 border-white/20 text-white">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              {/* Default Payment Method */}
              <div>
                <Label htmlFor="paymentMethod" className="text-gray-700 dark:text-white">Default Payment Method</Label>
                <Input id="paymentMethod" placeholder="Enter payment method" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); saveSetting('payment_method', e.target.value); }} className="mt-1 bg-white/10 border-white/20 text-white" />
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

// Confirm Dialog Component
const ConfirmDialog = ({ triggerText, onConfirm, title, description, disabled }) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>{triggerText}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsView;