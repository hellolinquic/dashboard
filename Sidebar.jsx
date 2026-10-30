import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, PlusCircle, Settings, X, ShoppingCart, BarChart2, HelpCircle, Sparkles, User, ListOrdered } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProfileDropdownContent from '@/components/dashboard/ProfileDropdownContent';

const Sidebar = ({ user, currentView, setCurrentView, onLogout, onSwitchRole, isOpen, setIsOpen }) => {

  const agenteeItems = [
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'purchase-history', label: 'Purchase History', icon: ListOrdered },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const agentorItems = [
    { id: 'my-creations', label: 'My creations', icon: PlusCircle },
    { id: 'published', label: 'Published', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  
  const additionalItems = [
      { id: 'support', label: 'Support', icon: HelpCircle },
      { id: 'assistant', label: 'Assistant', icon: Sparkles },
  ]

  const menuItems = user.role === 'agentor' ? agentorItems : agenteeItems;

  const handleNavigation = (viewId) => {
    if (viewId === 'support' || viewId === 'assistant') {
        toast({
          description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
        return;
    }
    setCurrentView(viewId);
    if(window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { x: 0 },
          closed: { x: "-100%" }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 flex flex-col lg:translate-x-0"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-8 h-10">
              <div className="flex items-center gap-2">
                <img
                  src="IMG-20251019-WA0004"  // <-- Replace with your actual logo path if different
                  alt="Company Logo"
                  className="w-8 h-8 object-contain"
                />
                <h2 className="text-2xl font-bold text-black">Linquic</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-[#3b82f6] text-white shadow-md'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <nav className="space-y-2 mb-4">
            {additionalItems.map((item) => {
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                      <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50">{user.name}</p>
                      <p className="text-xs truncate text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </div>
               </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 mb-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50" 
              side="top" 
              align="start"
            >
              <ProfileDropdownContent user={user} onLogout={onLogout} onSwitchRole={onSwitchRole} setCurrentView={setCurrentView} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;