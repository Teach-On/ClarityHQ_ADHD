export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | null;

export interface Subscription {
  id: string;
  status: SubscriptionStatus;
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
}

export interface ProFeatureState {
  streakTrackerEnabled: boolean;
  customRemindersEnabled: boolean;
  taskBreakdownEnabled: boolean;
  audioRecapEnabled: boolean;
}