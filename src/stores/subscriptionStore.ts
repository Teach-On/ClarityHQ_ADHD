import { create } from 'zustand';
import { SubscriptionStatus, Subscription, ProFeatureState } from '../types/subscription';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  proFeatures: ProFeatureState;
  isProUser: boolean;
  setSubscription: (subscription: Subscription | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  toggleProFeature: (featureName: keyof ProFeatureState) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  isLoading: false,
  error: null,
  isProUser: false,
  proFeatures: {
    streakTrackerEnabled: true,
    customRemindersEnabled: true,
    taskBreakdownEnabled: true,
    audioRecapEnabled: true,
  },
  
  setSubscription: (subscription) => set({ 
    subscription, 
    isProUser: subscription?.status === 'active' || subscription?.status === 'trialing'
  }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  toggleProFeature: (featureName) => set(state => ({
    proFeatures: {
      ...state.proFeatures,
      [featureName]: !state.proFeatures[featureName]
    }
  })),
}));