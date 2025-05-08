import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { 
  PaypalCredentials, 
  PaypalPayment, 
  PaypalPaymentResponse, 
  PaypalPayoutItem, 
  PaypalPayoutResponse 
} from '../interfaces/paypal.interface';

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private clientId: string = '';
  private clientSecret: string = '';
  private baseUrl: string;
  private accessToken: string;
  private tokenExpiry: Date;

  constructor(private configService: ConfigService) {
    this.initPaypalConfig();
  }

  private initPaypalConfig() {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    
    if (!clientId || !clientSecret) {
      this.logger.error('PayPal client ID hoặc client secret không được cấu hình');
      throw new Error('PayPal client ID hoặc client secret không được cấu hình');
    }
    
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    // Sử dụng Sandbox API URL cho môi trường phát triển
    this.baseUrl = 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Lấy access token từ PayPal API
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Kiểm tra xem token hiện tại có còn hợp lệ không
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
        },
      );

      this.accessToken = response.data.access_token;
      
      // Thời gian hết hạn (thường là 3600 giây)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      return this.accessToken;
    } catch (error) {
      this.logger.error(`Lỗi khi lấy access token từ PayPal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kiểm tra xem một email PayPal có hợp lệ không bằng cách gọi API PayPal
   * Lưu ý: Trong sandbox, bạn không thể thực sự kiểm tra tính hợp lệ của email
   * Trong môi trường thực, bạn có thể sử dụng PayPal Identity API
   */
  async validatePaypalEmail(email: string): Promise<boolean> {
    try {
      // Trong Sandbox, chúng ta không có cách nào để xác thực email
      // Trong môi trường thực, bạn cần sử dụng PayPal Identity API
      // Đây là một kiểm tra cơ bản về định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    } catch (error) {
      this.logger.error(`Lỗi khi xác thực email PayPal: ${error.message}`);
      return false;
    }
  }

  /**
   * Tạo thanh toán qua PayPal
   */
  async createPayment(payment: PaypalPayment): Promise<PaypalPaymentResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: payment.currency,
                value: payment.amount.toString(),
              },
              description: payment.description,
            },
          ],
          application_context: {
            return_url: payment.returnUrl,
            cancel_url: payment.cancelUrl,
            brand_name: 'Your Course Platform',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );
      
      // Trích xuất thông tin từ phản hồi của PayPal
      const paymentId = response.data.id;
      const approvalUrl = response.data.links.find(
        (link) => link.rel === 'approve'
      ).href;
      const status = response.data.status;

      return {
        paymentId,
        approvalUrl,
        status,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo thanh toán PayPal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Thực hiện chi trả cho instructor qua PayPal
   */
  async createPayout(payout: PaypalPayoutItem): Promise<PaypalPayoutResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const payoutRequest = {
        sender_batch_header: {
          sender_batch_id: `Batch_${Date.now()}`,
          email_subject: 'Bạn đã nhận được thanh toán từ khóa học',
          email_message: 'Bạn đã nhận được thanh toán cho khóa học của mình trên nền tảng của chúng tôi.',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: payout.amount.toString(),
              currency: payout.currency,
            },
            note: payout.note,
            sender_item_id: payout.senderItemId,
            receiver: payout.recipientEmail,
          },
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/v1/payments/payouts`,
        payoutRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );
      
      const result = response.data;

      return {
        batchId: result.batch_header.payout_batch_id,
        status: result.batch_header.batch_status,
        items: result.items.map((item) => ({
          payoutItemId: item.payout_item_id,
          status: item.transaction_status,
        })),
      };
    } catch (error) {
      this.logger.error(`Lỗi khi thực hiện chi trả PayPal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Xác nhận thanh toán đã được duyệt
   */
  async capturePayment(paymentId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${paymentId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );
      
      return response.data;
    } catch (error) {
      this.logger.error(`Lỗi khi xác nhận thanh toán PayPal: ${error.message}`);
      throw error;
    }
  }
} 