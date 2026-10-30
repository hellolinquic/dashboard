
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Package, Activity, TrendingUp, Users } from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-lg shadow-lg">
        <p className="label font-bold">{`${label}`}</p>
        <p className="intro text-blue-500">{`Earnings: ₹${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};


const AnalyticsView = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgentorAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('id, published, category, name, price')
        .eq('created_by', user.id);

      if (toolsError) throw toolsError;
      
      const toolIds = toolsData.map(t => t.id);

      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('price, tool_id, agentee_id')
        .in('tool_id', toolIds);

      if (purchasesError) throw purchasesError;
      
      const { data: clicksData, error: clicksError } = await supabase
          .from('analytics')
          .select('clicks, tool_id')
          .in('tool_id', toolIds);
      if (clicksError) throw clicksError;

      const totalTools = toolsData.length;
      const publishedTools = toolsData.filter(t => t.published).length;
      const pendingTools = totalTools - publishedTools;
      const totalEarnings = purchasesData.reduce((sum, p) => sum + p.price, 0);
      const totalClicks = clicksData.reduce((sum, c) => sum + (c.clicks || 0), 0);
      const activeUsers = new Set(purchasesData.map(p => p.agentee_id)).size;
      
      const earningsPerTool = toolsData.map(tool => {
          const earnings = purchasesData
              .filter(p => p.tool_id === tool.id)
              .reduce((sum, p) => sum + p.price, 0);
          return { name: tool.name, earnings };
      }).filter(t => t.earnings > 0);

      const earningsPerCategory = {};
      toolsData.forEach(tool => {
        const earnings = purchasesData
            .filter(p => p.tool_id === tool.id)
            .reduce((sum, p) => sum + p.price, 0);
        earningsPerCategory[tool.category] = (earningsPerCategory[tool.category] || 0) + earnings;
      });
      const earningsPerCategoryData = Object.entries(earningsPerCategory)
        .map(([name, earnings]) => ({ name, value: earnings }))
        .filter(c => c.value > 0);
      
      setStats({
        totalTools,
        publishedTools,
        pendingTools,
        totalEarnings,
        totalClicks,
        activeUsers,
        earningsPerTool,
        earningsPerCategoryData,
      });

    } catch (error) {
      toast({ title: 'Error fetching analytics', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [user.id, toast]);
  
  const fetchAgenteeAnalytics = useCallback(async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from('purchases').select('price').eq('agentee_id', user.id);
        if (error) throw error;
        setStats({
            purchasedTools: data.length,
            totalSpent: data.reduce((sum, p) => sum + p.price, 0),
            activityLevel: data.length > 5 ? 'High' : 'Medium',
        });
    } catch(error) {
        toast({ title: 'Error fetching your stats', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  }, [user.id, toast]);


  useEffect(() => {
    const fetchAnalytics = user.role === 'agentor' ? fetchAgentorAnalytics : fetchAgenteeAnalytics;
    fetchAnalytics();
    
    const channel = supabase.channel(`analytics:${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tools', filter: `created_by=eq.${user.id}` }, fetchAnalytics)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, fetchAnalytics)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics' }, fetchAnalytics)
        .subscribe();
        
    return () => supabase.removeChannel(channel);
  }, [user.role, fetchAgentorAnalytics, fetchAgenteeAnalytics]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const agentorCards = [
    { title: "Total Earnings", value: `₹${stats?.totalEarnings?.toFixed(2) || '0.00'}`, icon: DollarSign, color: "from-green-400 to-green-600" },
    { title: "Published Tools", value: stats?.publishedTools || 0, icon: Package, color: "from-blue-400 to-blue-600" },
    { title: "Pending Tools", value: stats?.pendingTools || 0, icon: Package, color: "from-yellow-400 to-yellow-600" },
    { title: "Total Clicks", value: stats?.totalClicks || 0, icon: Activity, color: "from-purple-400 to-purple-600" },
    { title: "Active Users", value: stats?.activeUsers || 0, icon: Users, color: "from-pink-400 to-pink-600" },
  ];

  const agenteeCards = [
    { title: "Purchased Tools", value: stats?.purchasedTools || 0, icon: Package, color: "from-blue-400 to-blue-600" },
    { title: "Total Spent", value: `₹${stats?.totalSpent || 0}`, icon: DollarSign, color: "from-green-400 to-green-600" },
    { title: "Activity Level", value: stats?.activityLevel || 'N/A', icon: TrendingUp, color: "from-purple-400 to-purple-600" },
  ];

  const cards = user.role === 'agentor' ? agentorCards : agenteeCards;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-500 dark:text-[#bfdbfe]">Track your performance and usage.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((stat, index) => <StatsCard key={index} {...stat} index={index} />)}
      </div>

      {user.role === 'agentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm h-80 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Earnings Per Tool</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.earningsPerTool} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(150,150,150,0.1)' }} />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm h-80 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Earnings Per Category</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.earningsPerCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {stats.earningsPerCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                 <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
