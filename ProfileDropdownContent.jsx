import React from 'react';
import { LogOut, Repeat, User as UserIcon, Settings, ShieldCheck, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const ProfileDropdownContent = ({ user, onLogout, onSwitchRole, setCurrentView }) => {
  const handleNotImplemented = () => {
    toast({
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleNavigation = (view) => {
    if (setCurrentView) {
      setCurrentView(view);
    } else {
      handleNotImplemented();
    }
  };

  return (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-50">{user.name}</p>
          <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">{user.email}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
      <DropdownMenuItem onClick={() => handleNavigation('profile')}>
        <UserIcon className="mr-2 h-4 w-4" />
        <span>My profile</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleNavigation('settings')}>
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
      <DropdownMenuItem onClick={handleNotImplemented}>
        <ShieldCheck className="mr-2 h-4 w-4" />
        <span>Privacy policy</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleNotImplemented}>
        <MessageSquare className="mr-2 h-4 w-4" />
        <span>Share feedback</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
      <DropdownMenuItem onClick={onSwitchRole}>
        <Repeat className="mr-2 h-4 w-4" />
        <span>Switch to {user.role === 'agentor' ? 'agentee' : 'agentor'}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />
      <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/20 focus:text-red-600 dark:focus:text-red-400">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign Out</span>
      </DropdownMenuItem>
    </>
  );
};

export default ProfileDropdownContent;