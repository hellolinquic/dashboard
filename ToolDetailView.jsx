
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Star, Users, Briefcase, ShoppingCart, Tag, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import MediaViewer from '@/components/dashboard/MediaViewer';

const ReviewModal = ({ isOpen, setIsOpen, toolId, user, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [purchaseId, setPurchaseId] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const checkPurchase = async () => {
            if (!isOpen) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('purchases')
                .select('id')
                .eq('agentee_id', user.id)
                .eq('tool_id', toolId)
                .limit(1);
            if (error) {
                toast({ title: "Error checking purchase", description: error.message, variant: "destructive" });
            } else if (data && data.length > 0) {
                setPurchaseId(data[0].id);
            }
            setLoading(false);
        };
        checkPurchase();
    }, [isOpen, user.id, toolId, toast]);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: "Please select a rating.", variant: "destructive" });
            return;
        }
        if (!purchaseId) {
            toast({ title: "You must purchase this tool to review it.", variant: "destructive" });
            return;
        }

        const { error } = await supabase
            .from('reviews')
            .insert({ tool_id: toolId, agentee_id: user.id, rating, comment, purchase_id: purchaseId });

        if (error) {
            if (error.code === '23505') { 
                toast({ title: "Review already submitted for this purchase.", description: "You can only submit one review per purchase.", variant: "destructive" });
            } else {
                toast({ title: "Failed to submit review.", description: error.message, variant: "destructive" });
            }
        } else {
            toast({ title: "Review submitted!", description: "Thank you for your feedback.", className: "bg-green-500 text-white" });
            onReviewSubmit();
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                </DialogHeader>
                {loading ? <p>Checking purchase status...</p> : purchaseId ? (<div className="space-y-4 py-4">
                    <div>
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={24} className={`cursor-pointer transition-colors ${i < (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => setRating(i + 1)} onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)} />
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="comment">Your Review</Label>
                        <Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} placeholder="What did you like or dislike?" />
                    </div>
                </div>) : <p className="py-4">You must purchase this item to leave a review.</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    {purchaseId && <Button onClick={handleSubmit}><ShoppingCart className="mr-2 h-4 w-4" /> Submit Review</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ToolDetailView = ({ tool, onBack, user, onPurchaseSuccess, isOwned, initialTab = 'about' }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
    const { toast } = useToast();

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tools')
            .select(`*, owner:profiles!created_by ( * ), reviews ( *, reviewer:profiles!agentee_id ( name ) ), purchases ( id )`)
            .eq('id', tool.id)
            .single();

        if (error) {
            toast({ title: 'Error fetching tool details', description: error.message, variant: 'destructive' });
        } else {
            const processedData = {
                ...data,
                avg_rating: data.reviews.length ? data.reviews.reduce((acc, r) => acc + r.rating, 0) / data.reviews.length : 0,
                purchase_count: data.purchases.length,
                reviews: data.reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            };
            setDetails(processedData);
        }
        setLoading(false);
    }, [tool.id, toast]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleMediaClick = (index) => {
        setMediaViewerIndex(index);
        setShowMediaViewer(true);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    if (!details) {
        return (
            <div>
                <Button onClick={onBack} variant="ghost"><ChevronLeft className="mr-2" /> Back to Marketplace</Button>
                <p className="text-center mt-8">Could not load tool details.</p>
            </div>
        );
    }

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                    <Button onClick={onBack} variant="ghost" className="mb-4"><ChevronLeft className="mr-2" /> Back to Marketplace</Button>
                </div>
                <div className="bg-white dark:glass-card p-6 rounded-2xl">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-zinc-800 rounded-xl flex-shrink-0">
                            <img alt={details.name} className="w-full h-full object-cover rounded-xl" src={details.logo_url || "https://images.unsplash.com/photo-1701439063562-fae1a60c6ba2"} />
                        </div>
                        <div className="flex-grow">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{details.name}</h1>
                            <p className="text-gray-600 dark:text-zinc-300 mt-1">{details.short_tagline}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="flex items-center text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">{details.category}</span>
                                {(details.tags || []).map(tag => (
                                    <span key={tag} className="flex items-center text-xs px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-full"><Tag size={12} className="mr-1"/>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t dark:border-zinc-700 mt-6 pt-4 flex flex-wrap items-center justify-around gap-4 text-center">
                        <StatItem icon={Star} value={details.avg_rating?.toFixed(1) || 'N/A'} label="Rating" />
                        <StatItem icon={Users} value={details.purchase_count} label="Purchases" />
                        <StatItem icon={Briefcase} value={details.industry || 'N/A'} label="Industry" />
                    </div>
                </div>

                <Tabs defaultValue={initialTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="about">About & Details</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        <TabsTrigger value="buy">Buy Now</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about" className="bg-white dark:glass-card p-6 rounded-2xl mt-2">
                        <InfoSection title="Full Description" content={details.description} />
                        <InfoSection title="Problem Solved" content={details.problem_solved} />
                        <InfoSection title="Core Features" content={details.features?.split('\n')} isList={true} />
                        <InfoSection title="Integrations" content={details.integrations?.split('\n')} isList={true} />
                        <InfoSection title="Dependencies" content={Array.isArray(details.dependencies) ? details.dependencies : (details.dependencies || '').split('\n')} isList={true} />
                        <InfoSection title="Highlights / Capabilities" content={details.highlights?.split('\n')} isList={true} />
                        <InfoSection title="Platform Compatibility" content={details.platform_compatibility} isList={true} />
                    </TabsContent>
                    <TabsContent value="media" className="bg-white dark:glass-card p-6 rounded-2xl mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(details.media_urls || []).map((url, index) => (
                                <motion.div
                                    key={index}
                                    className="rounded-lg overflow-hidden cursor-pointer group relative"
                                    onClick={() => handleMediaClick(index)}
                                    whileHover={{ scale: 1.03 }}
                                >
                                    <img src={url} alt={`media-${index}`} className="w-full h-48 object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white font-semibold">View</p>
                                    </div>
                                </motion.div>
                            ))}
                            {(details.media_urls || []).length === 0 && <p className="col-span-full text-center text-muted-foreground">No media provided.</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="reviews" className="bg-white dark:glass-card p-6 rounded-2xl mt-2 space-y-4">
                        <div className="flex justify-end">
                            {isOwned && <Button onClick={() => setShowReviewModal(true)}>Write a review</Button>}
                        </div>
                        {details.reviews.length > 0 ? (
                            details.reviews.map(review => (
                                <div key={review.id} className="border-b dark:border-zinc-700 pb-4 last:border-b-0">
                                    <div className="flex items-center mb-1">
                                        <p className="font-semibold">{review.reviewer?.name || 'Anonymous'}</p>
                                        <span className="text-xs text-gray-400 mx-2">•</span>
                                        <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                        <div className="flex items-center ml-auto">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-zinc-400">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 dark:text-zinc-400 py-8">No reviews yet — be the first to share your experience!</p>
                        )}
                    </TabsContent>
                    <TabsContent value="buy" className="bg-white dark:glass-card p-6 rounded-2xl mt-2">
                        <PlansSection tool={details} user={user} onPurchaseSuccess={onPurchaseSuccess} isOwned={isOwned} />
                    </TabsContent>
                </Tabs>
                {showReviewModal && <ReviewModal isOpen={showReviewModal} setIsOpen={setShowReviewModal} toolId={details.id} user={user} onReviewSubmit={fetchDetails} />}
            </motion.div>
            <AnimatePresence>
                {showMediaViewer && (
                    <MediaViewer
                        mediaUrls={details.media_urls || []}
                        startIndex={mediaViewerIndex}
                        onClose={() => setShowMediaViewer(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

const StatItem = ({ icon: Icon, value, label }) => (
    <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
            <Icon className="w-5 h-5 text-blue-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">{value}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-zinc-400">{label}</span>
    </div>
);

const InfoSection = ({ title, content, isList = false }) => (
    <div className="mb-6 last:mb-0">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
        {isList && Array.isArray(content) && content.length > 0 && content.some(item => item) ? (
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-zinc-300">
                {content.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        ) : !isList && content ? (
            <p className="text-gray-600 dark:text-zinc-300 whitespace-pre-wrap">{content}</p>
        ) : <p className="text-sm text-gray-400 dark:text-zinc-500">Not specified.</p>}
    </div>
);

const PlansSection = ({ tool, user, onPurchaseSuccess, isOwned }) => {
    const { toast } = useToast();
    const handleBuyNow = async (plan = null) => {
        if (user.role !== 'agentee') {
            toast({title: "Switch to Agentee role to purchase.", variant: "destructive"});
            return;
        }
        if (isOwned) {
            toast({title: "You already own this tool."});
            return;
        }

        const price = plan ? plan.price : tool.price;
        const plan_type = plan ? 'subscription' : tool.pricing_type;
        const plan_name = plan ? plan.name : (tool.pricing_type === 'one_time' ? 'One-Time License' : 'Free');

        const { error: historyError } = await supabase
            .from('purchases')
            .insert({
                agentee_id: user.id,
                agentor_id: tool.created_by,
                tool_id: tool.id,
                purchase_date: new Date().toISOString(),
                price: price || 0,
                plan_type,
                plan_name,
                status: 'active',
                tool_name: tool.name,
            });

        if (historyError) {
            toast({ title: "Purchase Failed", description: historyError.message, variant: "destructive" });
            return;
        }

        toast({ title: "Purchase Successful!", description: `You have acquired ${tool.name}.`, className: "bg-green-500 text-white" });
        onPurchaseSuccess(tool.id);
    };

    const renderPrice = () => {
        if (tool.pricing_type === 'free') return <p className="text-4xl font-bold">Free</p>;
        if (tool.pricing_type === 'one_time') return <p className="text-4xl font-bold">₹{tool.price}</p>;
        return null;
    }

    if (isOwned) {
        return (
            <div className="bg-white dark:glass-card p-6 rounded-2xl text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Tool Acquired</h2>
                <p className="text-muted-foreground">You can find this tool in your Purchase History.</p>
            </div>
        )
    }
    return (
        <div>
            <h2 className="text-2xl font-bold text-center mb-6">Plans & Subscriptions</h2>
            {tool.pricing_type !== 'subscription' ? (
                <div className="max-w-sm mx-auto text-center border dark:border-zinc-700 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold">{tool.pricing_type === 'one_time' ? 'One-Time Purchase' : 'Free Tool'}</h3>
                    {renderPrice()}
                    <Button className="mt-6 w-full" onClick={() => handleBuyNow()}>
                        <ShoppingCart className="mr-2" /> {tool.pricing_type === 'free' ? 'Get Tool' : 'Buy Now'}
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(tool.plans || []).map((plan, index) => (
                        <div key={index} className="border dark:border-zinc-700 p-6 rounded-lg flex flex-col">
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4">{plan.description}</p>
                            <div className="my-4">
                                <span className="text-4xl font-bold">₹{plan.price}</span>
                                <span className="text-gray-500 dark:text-zinc-400">/{plan.duration}</span>
                            </div>
                            <Button className="mt-auto w-full" onClick={() => handleBuyNow(plan)}>
                                <ShoppingCart className="mr-2 h-4 w-4" /> Subscribe
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ToolDetailView;
