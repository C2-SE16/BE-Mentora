export interface CartItem {
  courseId: string;
  name: string;
  price: number;
  currencyCode?: string;
  priceUSD?: number;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface PaymentCaptureResult {
  success: boolean;
  paymentId?: string;
  details?: any;
  error?: string;
}

export interface OrderRecord {
  orderId: string;
  userId: string;
  totalAmount: number;
  currencyCode?: string;
  exchangeRate?: number;
  totalAmountUSD?: number;
  paymentId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  items: {
    courseId: string;
    price: number;
    priceUSD?: number;
  }[];
  createdAt: Date;
  completedAt?: Date;
} 