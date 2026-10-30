import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle } from 'lucide-react';
import ToolDetailView from '@/components/dashboard/ToolDetailView';
import { supabase } from '@/lib/customSupabaseClient';

const ToolCard = ({ tool, user, index, onPurchaseSuccess }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  
  const handleOpenDetails = async () => {
    const { data } = await supabase
      .from('purchases')
      .select('id')
      .eq('agentee_id', user.id)
      .eq('tool_id', tool.id)
      .limit(1);

    if (data && data.length > 0) {
      setIsOwned(true);
    } else {
      setIsOwned(false);
    }
    setShowDetails(true);
  };
  
  const handleLocalPurchaseSuccess = (toolId) => {
    setIsOwned(true);
    setShowDetails(false); // Close detail view on successful purchase
    if (onPurchaseSuccess) {
      onPurchaseSuccess(toolId);
    }
  };


  if (showDetails) {
    return <ToolDetailView tool={tool} onBack={() => setShowDetails(false)} user={user} isOwned={isOwned} onPurchaseSuccess={handleLocalPurchaseSuccess} />;
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className="bg-white dark:glass-card rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col"
        onClick={handleOpenDetails}
      >
        <div className="h-40 bg-gray-200 dark:bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden relative">
          {isOwned && (
             <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={14} />
                Purchased
             </div>
          )}
          <img alt={tool.name} className="w-full h-full object-cover" src={tool.logo_url || "https://images.unsplash.com/photo-1595872018818-97555653a011"} />
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-md font-bold text-gray-800 dark:text-white line-clamp-1">{tool.name}</h3>
            <span className="flex-shrink-0 ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-md text-xs font-medium">
              {tool.category}
            </span>
          </div>
          
          <p className="text-gray-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2 flex-grow">{tool.short_tagline || tool.description}</p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-white/70">
              <Eye className="w-4 h-4" />
              <span>{tool.views || 0}</span>
            </div>
            <div className="font-bold text-lg text-gray-800 dark:text-white">
              {tool.pricing_type === 'free' ? 'Free' : tool.price ? `₹${tool.price}` : 'VARIES'}
            </div>
          </div>
        </div>
      </motion.div>
  );
};

export default ToolCard;