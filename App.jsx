import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';

function App() {
  const { profile, loading, updateUserRole, signOut } = useAuth();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    if (profile) {
      const userTheme = profile.dark_mode ? 'dark' : 'light';
      setTheme(userTheme);
      document.documentElement.classList.toggle('dark', userTheme === 'dark');
    } else {
      const storedTheme = localStorage.getItem('dashboard_theme') || 'dark';
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, [profile]);
  
  const handleRoleSwitch = () => {
    if (!profile) return;
    const newRole = profile.role === 'agentor' ? 'agentee' : 'agentor';
    updateUserRole(profile.id, newRole);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    if (profile) {
      await supabase
        .from('profiles')
        .update({ dark_mode: newTheme === 'dark' })
        .eq('id', profile.id);
    } else {
      localStorage.setItem('dashboard_theme', newTheme);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Linquic - AI Marketplace Dashboard</title>
        <meta name="description" content="Professional AI-powered marketplace connecting Agentors and Agentees." />
      </Helmet>
      {!profile ? (
        <AuthPage />
      ) : (
        <Dashboard 
          user={profile} 
          onSwitchRole={handleRoleSwitch}
          onLogout={signOut}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </>
  );
}

export default App;