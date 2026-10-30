import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from '@/components/dashboard/StatsCard';
import ToolCard from '@/components/dashboard/ToolCard';
import { DollarSign, Package, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardHome = ({ user }) => {
  // Mock data for demonstration
  const allTools = JSON.parse(localStorage.getItem('marketplace_tools') || '[]');
  const myTools = allTools.filter(tool => tool.owner_id === user.id);
  const myTransactions = JSON.parse(localStorage.getItem('marketplace_transactions') || '[]').filter(t => t.buyer_id === user.id);

  const agentorStats = [
    { title: "Total Earnings", value: "$1,250", icon: DollarSign, color: "from-green-400 to-green-600" },
    { title: "Active Tools", value: myTools.length, icon: Package, color: "from-blue-400 to-blue-600" },
    { title: "Total Sales", value: "82", icon: Users, color: "from-purple-400 to-purple-600" },
  ];

  const agenteeStats = [
    { title: "Purchased Tools", value: myTransactions.length, icon: Package, color: "from-blue-400 to-blue-600" },
    { title: "Total Spent", value: `$${myTransactions.reduce((acc, t) => acc + t.amount, 0)}`, icon: DollarSign, color: "from-green-400 to-green-600" },
    { title: "Credits Left", value: user.credits || 1000, icon: Activity, color: "from-purple-400 to-purple-600" },
  ];

  const stats = user.role === 'agentor' ? agentorStats : agenteeStats;
  const recentTools = allTools.slice(0, 3);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}!</h1>
        <p className="text-[#bfdbfe]">Here's what's happening in your AI marketplace.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <h2 className="text-2xl font-bold text-white">
            {user.role === 'agentor' ? 'My Recent Tools' : 'Recently Added Tools'}
          </h2>
          <div className="space-y-4">
            {(user.role === 'agentor' ? myTools.slice(0, 2) : recentTools.slice(0, 2)).map((tool, index) => (
              <motion.div 
                key={tool.id} 
                className="glass-card rounded-2xl p-4 flex items-center justify-between"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex-shrink-0">
                    <img alt={tool.title} class="w-full h-full object-cover rounded-xl" src="https://images.unsplash.com/photo-1615967122067-14640382c895" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{tool.title}</h3>
                    <p className="text-sm text-[#bfdbfe]">{tool.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${tool.price}</p>
                  <p className="text-sm text-white/70">
                    {tool.views || 0} views
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {user.role === 'agentor' ? 'Add a new Tool' : 'Explore the Marketplace'}
          </h3>
          <p className="text-[#bfdbfe] mb-4 text-sm">
            {user.role === 'agentor'
              ? 'Contribute to the ecosystem and earn rewards.'
              : 'Find the perfect tool to boost your productivity.'}
          </p>
          <Button className="w-full bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white font-semibold py-3 rounded-xl">
            {user.role === 'agentor' ? 'Add Tool' : 'Browse All'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHome;