export interface IGymdeskMember {
  id?: string;
  member_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}

export interface IGymdeskSubscription {
  id?: string;
  plan_id?: string;
  plan_name?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  next_billing_date?: string;
  amount?: number;
}

export interface IGymdeskWebhookPayload {
  event?: string; // e.g. 'member.signup', 'payment.success', 'subscription.canceled', etc.
  type?: string;
  member?: IGymdeskMember;
  subscription?: IGymdeskSubscription;
  data?: {
    member?: IGymdeskMember;
    subscription?: IGymdeskSubscription;
    email?: string;
    phone?: string;
    status?: string;
    [key: string]: any;
  };
  [key: string]: any;
}
