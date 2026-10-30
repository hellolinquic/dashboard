import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const NotificationsPanel = ({ isOpen, setIsOpen, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching notifications', description: error.message, variant: 'destructive' });
    } else {
      setNotifications(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, user.id]);

  const markAsRead = async (id) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const deleteNotification = async (id) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Notification deleted.' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-900 z-50 shadow-lg flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bell /> Notifications
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : notifications.length > 0 ? (
                <ul className="divide-y dark:divide-zinc-800">
                  {notifications.map(notification => (
                    <li
                      key={notification.id}
                      className={`p-4 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(notification.id)}>Mark as read</Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteNotification(notification.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-20">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You have no notifications.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;