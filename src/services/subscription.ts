import { supabase } from '../lib/supabase';
import { Subscription } from '../types/subscription';

// Utility function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Fetch user's subscription status from Supabase user metadata
export const getSubscription = async (): Promise<{ data: Subscription | null; error: Error | null }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    if (!userData.user) {
      return { data: null, error: new Error('No authenticated user found') };
    }
    
    // Check user metadata for subscription info
    const subscription = userData.user.user_metadata?.subscription as Subscription;
    
    return { data: subscription || null, error: null };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { data: null, error: error as Error };
  }
};

// Create checkout session with Stripe
export const createCheckoutSession = async (priceId: string): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      throw new Error('User not authenticated');
    }
    
    const userToken = authData.session.access_token;
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        priceId,
        successUrl: `${window.location.origin}/settings?subscription=success`,
        cancelUrl: `${window.location.origin}/settings?subscription=canceled`
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }
    
    const data = await response.json();
    return { url: data.url, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { url: null, error: error as Error };
  }
};

// Create portal session to manage subscription
export const createPortalSession = async (): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      throw new Error('User not authenticated');
    }
    
    const userToken = authData.session.access_token;
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        returnUrl: `${window.location.origin}/settings`
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create portal session');
    }
    
    const data = await response.json();
    return { url: data.url, error: null };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { url: null, error: error as Error };
  }
};

// Utility function to update user metadata when using webhooks
export const updateSubscriptionMetadata = async (
  subscription: Subscription
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { subscription }
    });
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating subscription metadata:', error);
    return { success: false, error: error as Error };
  }
};