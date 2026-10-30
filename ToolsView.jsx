import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const ToolsView = ({ user, onEdit }) => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toolToDelete, setToolToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

  // Fetch tools from Supabase
  const fetchTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('published', true)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching tools', description: error.message, variant: 'destructive' });
    } else {
      setTools(data);
    }
    setLoading(false);
  };

  // Supabase Realtime subscription
  useEffect(() => {
    fetchTools();

    const channel = supabase
      .channel('tools_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tools', filter: `created_by=eq.${user.id}` },
        fetchTools
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const getStatus = (tool) => {
    if (!tool.published_at) return 'Draft';
    return new Date(tool.updated_at) > new Date(tool.published_at) ? 'Edited' : 'Active';
  };

  const handleDeleteRequest = (tool) => {
    setToolToDelete(tool);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toolToDelete) return;
    const { error } = await supabase.from('tools').delete().eq('id', toolToDelete.id);
    if (error) {
      toast({ title: 'Error deleting tool', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tool Deleted', description: `"${toolToDelete.name}" has been permanently deleted.` });
      fetchTools();
    }
    setShowDeleteConfirm(false);
    setToolToDelete(null);
  };

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Published Tools</h1>
        <p className="text-gray-500 dark:text-[#bfdbfe]">Your live tools on the marketplace.</p>
        <input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-4 w-full p-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white"
        />
      </motion.div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              className="bg-white dark:glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
              layout
            >
              {/* Tool Logo */}
              <div className="h-40 bg-gray-200 dark:bg-zinc-800 relative">
                <img
                  alt={tool.name}
                  src={tool.logo_url || 'https://images.unsplash.com/photo-1595872018818-97555653a011'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-white/80 dark:bg-black/80 backdrop-blur-sm h-8 w-8"
                    onClick={() => onEdit(tool.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteRequest(tool)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tool Details */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-md font-bold text-gray-800 dark:text-white line-clamp-1">{tool.name}</h3>
                <p className="text-xs font-mono text-muted-foreground">{tool.tool_code}</p>
                <span className="mt-1 px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-md text-xs font-medium self-start">
                  {tool.category}
                </span>

                <div className="mt-auto pt-4 border-t dark:border-zinc-700 space-y-2 text-xs text-muted-foreground">
                  {/* Removed Published Date */}
                  <p>
                    <strong>Last Updated:</strong> {new Date(tool.updated_at).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={getStatus(tool) === 'Edited' ? 'text-yellow-500' : 'text-green-500'}>
                      {getStatus(tool)}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:glass-card rounded-2xl p-12 text-center mt-8">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-white/50" />
          <p className="text-gray-600 dark:text-white/70 text-lg">
            You haven't published any tools yet. Go to "My Creations" to publish a draft.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{toolToDelete?.name}" from the marketplace. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToolsView;