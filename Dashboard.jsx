import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Navbar from '@/components/dashboard/Navbar';
import ToolsView from '@/components/dashboard/ToolsView';
import AddTool from '@/components/dashboard/AddTool';
import SettingsView from '@/components/dashboard/SettingsView';
import AnalyticsView from '@/components/dashboard/AnalyticsView';
import PurchaseListView from '@/components/dashboard/PurchaseListView';
import ProfileView from '@/components/dashboard/ProfileView';
import Marketplace from '@/components/dashboard/Marketplace';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Dashboard = ({ user, onSwitchRole, theme, toggleTheme }) => {
  const [currentView, setCurrentView] = useState(user.role === 'agentor' ? 'my-creations' : 'marketplace');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [editToolId, setEditToolId] = useState(null);
  const { signOut } = useAuth();
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user.role === 'agentor' && !['my-creations', 'analytics', 'settings', 'profile', 'published'].includes(currentView)) {
      setCurrentView('my-creations');
    }
    if (user.role === 'agentee' && !['marketplace', 'purchase-history', 'settings', 'profile'].includes(currentView)) {
      setCurrentView('marketplace');
    }
    if (currentView !== 'my-creations') {
        setEditToolId(null);
    }
  }, [user.role, currentView]);

  const handleEditRequest = (toolId) => {
    setEditToolId(toolId);
    setCurrentView('my-creations');
  };
  
  const handleSetCurrentView = (view) => {
    setCurrentView(view);
  }

  const renderView = () => {
    if (currentView === 'profile') {
      return <ProfileView />;
    }
    if (currentView === 'settings') {
      return <SettingsView user={user} theme={theme} toggleTheme={toggleTheme} />;
    }
    if (currentView === 'analytics' && user.role === 'agentor') {
      return <AnalyticsView user={user} />;
    }

    if (user.role === 'agentee') {
      switch (currentView) {
        case 'marketplace':
          return <Marketplace user={user} />;
        case 'purchase-history':
          return <PurchaseListView user={user} />;
        default:
          return <Marketplace user={user} />;
      }
    }
    
    if (user.role === 'agentor') {
      switch (currentView) {
        case 'my-creations':
          return <AddTool user={user} onPublishSuccess={() => setCurrentView('published')} onEditRequest={editToolId} />;
        case 'published':
            return <ToolsView user={user} onEdit={handleEditRequest} />;
        default:
          return <AddTool user={user} onPublishSuccess={() => setCurrentView('published')} />;
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar
        user={user}
        currentView={currentView}
        setCurrentView={handleSetCurrentView}
        onLogout={signOut}
        onSwitchRole={onSwitchRole}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 transition-all duration-300 ease-in-out">
        <Navbar 
          user={user} 
          setSidebarOpen={setSidebarOpen} 
          onLogout={signOut}
          onSwitchRole={onSwitchRole}
          setCurrentView={handleSetCurrentView}
        />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;