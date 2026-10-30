import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, color, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-[#bfdbfe] text-sm mb-1 capitalize">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;