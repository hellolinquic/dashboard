import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, ArrowDownUp, Star, Package, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ToolDetailView from '@/components/dashboard/ToolDetailView';

const MarketplaceToolCard = ({ tool, onSelect, index, isOwned, onBuyNow }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white dark:glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
  >
    <div onClick={() => onSelect(tool)} className="cursor-pointer">
      <div className="h-40 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center relative">
        {isOwned && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle size={14} />
            Purchased
          </div>
        )}
        <img alt={tool.name} className="w-full h-full object-cover" src={tool.logo_url || "https://images.unsplash.com/photo-1615967122067-14640382c895"} />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 dark:text-white truncate">{tool.name}</h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2 line-clamp-1">{tool.short_tagline || tool.description}</p>
        <div className="flex items-center gap-2 text-xs mb-3">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">{tool.category}</span>
        </div>
        <div className="flex justify-between items-center mt-auto text-sm">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={16} />
            <span className="font-semibold text-gray-700 dark:text-zinc-300">{tool.average_rating?.toFixed(1) || 'New'}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-zinc-400">
            <Package size={16} />
            <span>{tool.purchase_count || 0}</span>
          </div>
          <span className="font-bold text-lg text-gray-800 dark:text-white">
            {tool.pricing_type === 'free' ? 'Free' : tool.price ? `₹${tool.price}` : 'VARIES'}
          </span>
        </div>
      </div>
    </div>
    <div className="p-4 pt-0">
        <Button className="w-full" onClick={() => onBuyNow(tool)}>Buy</Button>
    </div>
  </motion.div>
);

const Marketplace = ({ user }) => {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ sort: 'created_at-desc' });
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedToolInitialTab, setSelectedToolInitialTab] = useState('about');
  const [ownedToolIds, setOwnedToolIds] = useState(new Set());
  const { toast } = useToast();

  const fetchToolsAndPurchases = useCallback(async () => {
    setLoading(true);

    const { data: purchaseData, error: purchaseError } = await supabase
      .from('purchases')
      .select('tool_id')
      .eq('agentee_id', user.id);
    
    if (purchaseError) {
      toast({ title: 'Error fetching purchases', description: purchaseError.message, variant: 'destructive' });
    } else {
      setOwnedToolIds(new Set(purchaseData.map(p => p.tool_id)));
    }
    
    let query = supabase
      .from('tools')
      .select(`*, reviews(rating), purchases(id)`)
      .eq('published', true);

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,tags.cs.{${searchTerm}},category.ilike.%${searchTerm}%`);
    }

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category);
    }
    
    const [sortField, sortOrder] = filters.sort.split('-');
    if (sortField === 'price') {
      query = query.order('price', { ascending: sortOrder === 'asc' });
    } else if (sortField === 'popularity') {
       // Cannot directly sort by count of related table, so we do client-side sort for this one
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Error fetching tools', description: error.message, variant: 'destructive' });
      setTools([]);
    } else {
      let processedData = data.map(tool => ({
        ...tool,
        average_rating: tool.reviews.length ? tool.reviews.reduce((acc, r) => acc + r.rating, 0) / tool.reviews.length : 0,
        purchase_count: tool.purchases.length,
      }));
      
      if (sortField === 'popularity') {
        processedData.sort((a,b) => b.purchase_count - a.purchase_count);
      }

      setTools(processedData);
    }
    setLoading(false);
  }, [searchTerm, filters, toast, user.id]);

  useEffect(() => {
    fetchToolsAndPurchases();
    const channel = supabase.channel('public:purchases').on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, fetchToolsAndPurchases).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchToolsAndPurchases]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({...prev, [type]: value}));
  };
  
  const handlePurchaseSuccess = (toolId) => {
      setOwnedToolIds(prev => new Set(prev).add(toolId));
      setSelectedTool(null);
  };
  
  const handleSelectTool = (tool, initialTab = 'about') => {
      setSelectedTool(tool);
      setSelectedToolInitialTab(initialTab);
  }

  if (selectedTool) {
    return <ToolDetailView tool={selectedTool} onBack={() => setSelectedTool(null)} user={user} onPurchaseSuccess={handlePurchaseSuccess} isOwned={ownedToolIds.has(selectedTool.id)} initialTab={selectedToolInitialTab} />;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Marketplace</h1>
        <p className="text-gray-500 dark:text-zinc-400">Discover and acquire powerful AI tools.</p>
      </motion.div>

      <div className="sticky top-[70px] z-10 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm py-4 -mx-4 px-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, tag, or category..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleFilterChange('category', 'All')}>All Categories</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleFilterChange('category', 'Chatbot')}>Chatbot</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleFilterChange('category', 'Agent')}>Agent</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleFilterChange('category', 'Tool')}>AI Tool</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto"><ArrowDownUp className="mr-2 h-4 w-4" /> Sort</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleFilterChange('sort', 'created_at-desc')}>Newest</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleFilterChange('sort', 'popularity-desc')}>Most Popular</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleFilterChange('sort', 'price-asc')}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleFilterChange('sort', 'price-desc')}>Price: High to Low</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
      ) : tools.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool, i) => <MarketplaceToolCard key={tool.id} tool={tool} onSelect={handleSelectTool} onBuyNow={(tool) => handleSelectTool(tool, 'buy')} index={i} isOwned={ownedToolIds.has(tool.id)} />)}
        </motion.div>
      ) : (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold">No tools found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;