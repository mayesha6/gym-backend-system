export interface ICreateCheckoutPayload {
  planId: string;
}

export interface ISubscriptionCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}
