import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle, AlertTriangle, ExternalLink, Hourglass, CloudOff, AlertCircle, CreditCard } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { getSubscription, createCheckoutSession, createPortalSession } from '../../services/subscription';

const PRICE_ID = 'price_1Og6ZbLkdIwHu7oBS9YhUiJr'; // Replace with your actual Stripe price ID

interface PlanFeature {
  name: string;
  included: boolean;
}

const ProFeatures: PlanFeature[] = [
  { name: 'Streak tracker & reflection journal', included: true },
  { name: 'Customizable reminders', included: true },
  { name: 'Task breakdown assistant', included: true },
  { name: 'Audio recap of tasks via TTS', included: true },
  { name: 'Priority support', included: true },
];

const BasicFeatures: PlanFeature[] = [
  { name: 'Task management', included: true },
  { name: 'Habit tracking', included: true },
  { name: 'Focus timer', included: true },
  { name: 'Calendar integration', included: true },
  { name: 'Dark/light mode', included: true },
];

const SubscriptionManagement = () => {
  const { user } = useUserStore();
  const { subscription, isProUser, setSubscription, setIsLoading, setError } = useSubscriptionStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        console.log('User not authenticated, skipping subscription fetch');
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error } = await getSubscription();
        
        if (error) throw error;
        
        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch subscription if user is authenticated
    if (user) {
      fetchSubscription();
    }
    
    // Check URL params for Stripe checkout result
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionStatus = urlParams.get('subscription');
    
    if (subscriptionStatus === 'success') {
      setStatusMessage('Your subscription has been successfully activated!');
      if (user) {
        fetchSubscription(); // Refresh subscription data only if user is authenticated
      }
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (subscriptionStatus === 'canceled') {
      setStatusMessage('Subscription checkout was canceled.');
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, setSubscription, setIsLoading, setError]);
  
  const handleSubscribe = async () => {
    if (!user) {
      setStatusMessage('Please log in to subscribe');
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage(null);
    
    try {
      const { url, error } = await createCheckoutSession(PRICE_ID);
      
      if (error) throw error;
      
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setStatusMessage('Failed to create checkout session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleManageSubscription = async () => {
    if (!user) {
      setStatusMessage('Please log in to manage your subscription');
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage(null);
    
    try {
      const { url, error } = await createPortalSession();
      
      if (error) throw error;
      
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error creating portal session:', err);
      setStatusMessage('Failed to access subscription portal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper to render subscription status icon and text
  const renderSubscriptionStatus = () => {
    if (!subscription) {
      return (
        <div className="flex items-center text-slate-600 dark:text-slate-400">
          <CloudOff className="mr-2 h-5 w-5" />
          <span>No active subscription</span>
        </div>
      );
    }
    
    switch (subscription.status) {
      case 'active':
        return (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>Active subscription</span>
          </div>
        );
      case 'trialing':
        return (
          <div className="flex items-center text-blue-600 dark:text-blue-400">
            <Hourglass className="mr-2 h-5 w-5" />
            <span>Trial period</span>
          </div>
        );
      case 'past_due':
        return (
          <div className="flex items-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>Payment past due</span>
          </div>
        );
      case 'canceled':
        return (
          <div className="flex items-center text-slate-600 dark:text-slate-400">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>Subscription canceled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-slate-600 dark:text-slate-400">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>Subscription: {subscription.status}</span>
          </div>
        );
    }
  };
  
  return (
    <div className="mt-8 space-y-6">
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        >
          {statusMessage}
        </motion.div>
      )}
      
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Basic Plan */}
        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Basic Plan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Core functionality for free</p>
          </div>
          
          <p className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">$0<span className="text-lg font-normal text-slate-500 dark:text-slate-400">/month</span></p>
          
          <ul className="mb-8 space-y-3">
            {BasicFeatures.map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className={`mr-2 h-4 w-4 ${feature.included ? 'text-green-500 dark:text-green-400' : 'text-slate-300 dark:text-slate-600'}`} />
                <span className={`text-sm ${feature.included ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
          
          <button
            disabled
            className="w-full rounded-md border border-slate-300 bg-slate-100 py-2 text-center text-sm font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
          >
            Current Plan
          </button>
        </div>
        
        {/* Pro Plan */}
        <div className="flex-1 rounded-lg border-2 border-blue-500 bg-white p-6 shadow-md dark:bg-slate-800">
          <div className="mb-1 flex items-center">
            <Crown className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">Pro Plan</h3>
          </div>
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">Advanced features for ADHD support</p>
          
          <p className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">$9.99<span className="text-lg font-normal text-slate-500 dark:text-slate-400">/month</span></p>
          
          <ul className="mb-8 space-y-3">
            {ProFeatures.map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {feature.name}
                </span>
              </li>
            ))}
            <li className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Everything in Basic
              </span>
            </li>
          </ul>
          
          <div className="mb-4">
            {renderSubscriptionStatus()}
          </div>
          
          {isProUser ? (
            <button
              onClick={handleManageSubscription}
              disabled={isProcessing || !user}
              className="w-full rounded-md bg-blue-100 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={isProcessing || !user}
              className="w-full rounded-md bg-blue-500 py-2 text-center text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : !user ? (
                <span className="flex items-center justify-center">
                  <Crown className="mr-2 h-4 w-4" />
                  Login to Upgrade
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400">
        All payments are processed securely through Stripe. You can cancel anytime.
      </p>
    </div>
  );
};

export default SubscriptionManagement;