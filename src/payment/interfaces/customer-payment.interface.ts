export interface CartItem {
  courseId: string;
  name: string;
  price: number;
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
  paymentId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  items: {
    courseId: string;
    price: number;
  }[];
  createdAt: Date;
  completedAt?: Date;
} 