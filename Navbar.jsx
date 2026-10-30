import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Menu, Wallet, Layers, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import ProfileDropdownContent from "@/components/dashboard/ProfileDropdownContent";
import { supabase } from "@/lib/customSupabaseClient";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";

const PlanModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[90%] max-w-lg p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Your Plan</h2>
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Current Plan:</strong> {user.plan || "Free"}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Usage Limit:</strong> {user.usage_limit || "Basic access"}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Next Billing:</strong>{" "}
            {user.next_billing_date || "Not applicable"}
          </p>
          <Button className="w-full mt-4">Upgrade Plan</Button>
        </div>
      </motion.div>
    </div>
  );
};

const CreditsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-[90%] max-w-lg p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold mb-4 dark:text-white">
          Your Credits
        </h2>
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Available Credits:</strong> {user.credits || 1000}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Last Top-Up:</strong>{" "}
            {user.last_topup_date || "No recent top-up"}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Usage:</strong> {user.credit_usage || "0 used this month"}
          </p>
          <Button className="w-full mt-4">Buy More Credits</Button>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ user, setSidebarOpen, onLogout, onSwitchRole, setCurrentView }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (!error) setNotificationCount(count);
    };
    fetchNotificationCount();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchNotificationCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleNotificationClick = () => setShowNotifications(true);

  return (
    <>
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] shadow-md backdrop-blur-lg">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-[#bfdbfe]"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Credits Icon for Agentee */}
              {user.role === "agentee" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreditsModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/20"
                >
                  <Wallet className="w-5 h-5 text-purple-500 dark:text-[#bfdbfe]" />
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {user.credits || 1000}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-white/70">
                    credits
                  </span>
                </motion.button>
              )}

              {/* Plan Icon for Agentor */}
              {user.role === "agentor" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPlanModal(true)}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
                >
                  <Layers className="w-5 h-5 text-gray-600 dark:text-white" />
                </motion.button>
              )}

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
                onClick={handleNotificationClick}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-white" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notificationCount}
                  </span>
                )}
              </motion.button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="w-10 h-10 border-2 border-transparent group-hover:border-purple-400">
                      <AvatarImage
                        src={user.avatar_url || user.company_logo_url}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                  align="end"
                  forceMount
                >
                  <ProfileDropdownContent
                    user={user}
                    onLogout={onLogout}
                    onSwitchRole={onSwitchRole}
                    setCurrentView={setCurrentView}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Panels / Modals */}
      <NotificationsPanel
        isOpen={showNotifications}
        setIsOpen={setShowNotifications}
        user={user}
      />
      <PlanModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} user={user} />
      <CreditsModal isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} user={user} />
    </>
  );
};

export default Navbar;