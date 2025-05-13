export interface PaypalCredentials {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
}

export interface PaypalAccountInfo {
  email: string;
  merchantId?: string;
}

export interface PaypalPayment {
  amount: number;
  currency: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PaypalPaymentResponse {
  paymentId: string;
  approvalUrl: string;
  status: string;
  totalAmountUSD?: number;
  exchangeRate?: number;
  originalCurrency?: string;
}

export interface PaypalPayoutItem {
  recipientEmail: string;
  amount: number;
  currency: string;
  note: string;
  senderItemId: string;
}

export interface PaypalPayoutResponse {
  batchId: string;
  status: string;
  items: Array<{
    payoutItemId: string;
    status: string;
  }>;
} 