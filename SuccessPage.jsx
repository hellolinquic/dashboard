
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Package } from 'lucide-react';
import { Helmet } from 'react-helmet';

const SuccessPage = () => {
  return (
    <>
      <Helmet>
        <title>Payment Successful - Our Store</title>
        <meta name="description" content="Your payment was successful." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="max-w-md w-full glass-card text-center p-8 rounded-2xl"
        >
          <CheckCircle className="mx-auto h-20 w-20 text-green-400 mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
          <p className="text-gray-300 mb-8">
            Thank you for your purchase. Your order is being processed and you'll receive a confirmation email shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold">
              <Link to="/store">
                <Package className="mr-2 h-4 w-4" /> Continue Shopping
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link to="/dashboard/purchase-history">
                <Home className="mr-2 h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SuccessPage;
