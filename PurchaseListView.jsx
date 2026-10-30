import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Trash2, Star, Send, PlayCircle, ArrowUp } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// ----------------- Review Modal -----------------
const ReviewModal = ({ isOpen, setIsOpen, purchase, user, onReviewSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      tool_id: purchase.tool_id,
      agentee_id: user.id,
      rating,
      comment,
      purchase_id: purchase.id,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'You have already reviewed this tool for this purchase.', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to submit review.', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Review submitted!', description: 'Thank you for your feedback.', className: 'bg-green-500 text-white' });
      onReviewSubmit && onReviewSubmit();
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review for {purchase?.tool_name}</DialogTitle>
          <DialogDescription>Share your experience with this tool.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Rating</Label>
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  className={`cursor-pointer transition-colors ${i < (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Your Review</Label>
            <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like or dislike?" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}><Send className="mr-2 h-4 w-4" /> Submit Review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ----------------- Use Tool Modal -----------------
const UseToolModal = ({ isOpen, setIsOpen, toolUrl }) => {
  return (
    <Dialog open={!!isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Using Tool</DialogTitle>
        </DialogHeader>

        {toolUrl ? (
          <iframe src={toolUrl} title="Tool" className="w-full h-full border-0 rounded-lg" />
        ) : (
          <p className="text-center py-10">No public URL has been provided for this tool by the creator.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ----------------- Upgrade Modal (per-purchase) -----------------
const UpgradeModal = ({ isOpen, setIsOpen, purchase, user, onUpgraded }) => {
  const { toast } = useToast();
  const [selectedPlanKey, setSelectedPlanKey] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlanKey(null);
      setProcessing(false);
    }
  }, [isOpen]);

  if (!purchase) return null;

  // plans might be stored in purchase.tool.plans_detail or purchase.tool.plans
  // We'll attempt multiple common property names
  const plans = purchase?.tool?.plans_detail || purchase?.tool?.plans || [];

  const handleConfirmUpgrade = async () => {
    if (!selectedPlanKey) {
      toast({ title: 'Choose a plan first', variant: 'destructive' });
      return;
    }
    setProcessing(true);

    try {
      // update purchase with selected plan (plan_type and plan_name)
      const updates = {};
      // if plan entries are objects with key/name/price
      const chosen = plans.find((p) => {
        if (!p) return false;
        if (typeof p === 'string') return p === selectedPlanKey;
        return (p.key === selectedPlanKey) || (p.name === selectedPlanKey) || (p.id === selectedPlanKey);
      });

      if (chosen) {
        updates.plan_type = chosen.key || chosen.id || chosen.name || selectedPlanKey;
        updates.plan_name = chosen.name || chosen.title || chosen.key || selectedPlanKey;
      } else {
        // fallback: use selectedPlanKey as plan_type
        updates.plan_type = selectedPlanKey;
        updates.plan_name = selectedPlanKey;
      }

      const { error } = await supabase.from('purchases').update(updates).eq('id', purchase.id);

      if (error) {
        toast({ title: 'Upgrade failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Plan upgraded', description: `Purchase updated to ${updates.plan_name || updates.plan_type}` });
        onUpgraded && onUpgraded();
        setIsOpen(false);
      }
    } catch (err) {
      toast({ title: 'Upgrade error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade Plan for {purchase.tool_name}</DialogTitle>
          <DialogDescription>Select a plan to upgrade this purchase.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {(!plans || plans.length === 0) && (
            <p className="text-sm text-muted-foreground">No plans are configured for this tool. Ask the creator to add pricing plans.</p>
          )}

          <div className="grid gap-3">
            {plans.map((p, i) => {
              // normalize label & key
              const label = typeof p === 'string' ? p : p.name || p.title || p.key || `Plan ${i+1}`;
              const key = typeof p === 'string' ? p : p.key || p.id || label;
              const priceText = (p && (p.price || p.cost || p.amount)) ? ` • ${p.price || p.cost || p.amount}` : '';
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlanKey(key)}
                  className={`text-left p-3 rounded-lg border ${selectedPlanKey === key ? 'border-purple-500 bg-purple-50 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{label}</div>
                      {p && p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                    </div>
                    <div className="text-sm font-medium">{priceText}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleConfirmUpgrade} disabled={processing || !selectedPlanKey}>
            {processing ? 'Processing...' : <><ArrowUp className="mr-2 h-4 w-4" /> Upgrade</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ----------------- Main PurchaseListView (updated) -----------------
const PurchaseListView = ({ user }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [usingTool, setUsingTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState(null);

  const { toast } = useToast();

  // Fetch purchases + join tool
  const fetchPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchases')
      .select('*, tool:tools(*)')
      .eq('agentee_id', user.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching purchase history', description: error.message, variant: 'destructive' });
      setPurchases([]);
    } else {
      setPurchases(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();

    // realtime subscription to user's purchases
    const channel = supabase
      .channel(`public:purchases:agentee_id=eq.${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases', filter: `agentee_id=eq.${user.id}` }, fetchPurchases)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Request delete (open confirm)
  const handleDeleteRequest = (purchase) => {
    setItemToDelete(purchase);
    setShowDeleteConfirm(true);
  };

  // Confirm delete (robust)
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeletingId(itemToDelete.id);

    try {
      // delete reviews referencing this purchase (if any)
      const { error: revErr } = await supabase.from('reviews').delete().eq('purchase_id', itemToDelete.id);
      if (revErr) {
        // don't abort — just log & notify
        toast({ title: 'Warning clearing reviews', description: revErr.message, variant: 'destructive' });
      }

      // delete purchase row
      const { error } = await supabase.from('purchases').delete().eq('id', itemToDelete.id);
      if (error) {
        toast({ title: 'Error deleting purchase', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Purchase record deleted.', className: 'bg-blue-500 text-white' });
        // refresh purchases
        await fetchPurchases();
      }
    } catch (err) {
      toast({ title: 'Delete error', description: err.message, variant: 'destructive' });
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      setDeletingId(null);
    }
  };

  // Use tool (open public url)
  const handleUseTool = (purchase) => {
    if (purchase.tool && purchase.tool.public_url) {
      setUsingTool(purchase.tool.public_url);
    } else {
      toast({ title: 'Tool URL not available.', description: 'The creator has not set a URL for this tool.', variant: 'destructive' });
    }
  };

  // Upgrade per-purchase
  const handleOpenUpgrade = (purchase) => {
    setUpgradeTarget(purchase);
    setUpgradeModalOpen(true);
  };

  const onUpgradeComplete = async () => {
    await fetchPurchases();
    setUpgradeModalOpen(false);
    setUpgradeTarget(null);
  };

  // client-side search
  const filtered = purchases.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (p.tool_name || '').toLowerCase();
    const category = (p.tool?.category || '').toLowerCase();
    const code = (p.tool_code || '').toLowerCase();
    const plan = ((p.plan_name || p.plan_type) || '').toLowerCase();
    return name.includes(q) || category.includes(q) || code.includes(q) || plan.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header + search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Purchase History</h1>
          <p className="text-gray-500 dark:text-[#bfdbfe]">Your history of acquired tools and plans.</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="w-full max-w-md">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tool, category, code or plan..."
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-50"
            />
          </div>
        </div>
      </motion.div>

      {/* grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((purchase, idx) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white dark:glass-card rounded-2xl shadow-sm flex flex-col"
            >
              {/* top area: logo + info + per-card action buttons */}
              <div className="p-4 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src={purchase.tool?.logo_url || '/placeholder.svg'}
                    alt={purchase.tool_name}
                    className="max-h-12 w-auto object-contain rounded-md"
                  />
                </div>

                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">{purchase.tool_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{purchase.tool?.category}</p>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400 capitalize">
                    {purchase.plan_name || (purchase.plan_type || '').replace('_', ' ')}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Upgrade button (per-card) */}
                  <Button size="icon" onClick={() => handleOpenUpgrade(purchase)} title="Upgrade this purchase">
                    <ArrowUp className="w-4 h-4" />
                  </Button>

                  {/* Delete button - disables during deletion */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="mt-1"
                    onClick={() => handleDeleteRequest(purchase)}
                    disabled={deletingId === purchase.id}
                  >
                    {deletingId === purchase.id ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* meta area */}
              <div className="border-t dark:border-zinc-700 px-4 py-3 text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold ${purchase.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>{purchase.status}</span>
                </div>

                <div className="flex justify-between">
                  <span>Purchased:</span>
                  <span>{purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleString() : 'N/A'}</span>
                </div>

                {purchase.expires_at && (
                  <div className="flex justify-between">
                    <span>Valid until:</span>
                    <span>{new Date(purchase.expires_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* actions */}
              <div className="p-4 border-t dark:border-zinc-700 grid grid-cols-2 gap-2">
                <Button onClick={() => handleUseTool(purchase)}><PlayCircle className="mr-2 h-4 w-4" /> Use Tool</Button>
                <Button variant="outline" onClick={() => setReviewingItem(purchase)}><Star className="mr-2 h-4 w-4" /> Review</Button>
              </div>

            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:glass-card rounded-2xl p-12 text-center mt-8">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-white/50" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-white">No purchases yet</h3>
          <p className="text-gray-500 dark:text-white/70 mt-2">Your purchased tools will appear here.</p>
        </div>
      )}

      {/* modals */}
      {reviewingItem && (
        <ReviewModal isOpen={!!reviewingItem} setIsOpen={() => setReviewingItem(null)} purchase={reviewingItem} user={user} onReviewSubmit={fetchPurchases} />
      )}

      {usingTool && (
        <UseToolModal isOpen={!!usingTool} setIsOpen={() => setUsingTool(null)} toolUrl={usingTool} />
      )}

      <UpgradeModal
        isOpen={upgradeModalOpen}
        setIsOpen={setUpgradeModalOpen}
        purchase={upgradeTarget}
        user={user}
        onUpgraded={onUpgradeComplete}
      />

      {/* delete confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the purchase record for "{itemToDelete?.tool_name}". This action cannot be undone and will remove any review you made for this purchase.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseListView;