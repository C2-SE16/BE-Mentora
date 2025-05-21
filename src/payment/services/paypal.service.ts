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
import { CartItem } from '../interfaces/customer-payment.interface';

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private clientId: string = '';
  private clientSecret: string = '';
  private baseUrl: string;
  private accessToken: string;
  private tokenExpiry: Date;
  private adminPaypalEmail: string;
  private exchangeRateApiKey: string = '';

  constructor(private configService: ConfigService) {
    this.initPaypalConfig();
  }

  private initPaypalConfig() {
    const mode = this.configService.get<'sandbox' | 'live'>('PAYPAL_MODE', 'sandbox');
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET', '');
    this.adminPaypalEmail = this.configService.get<string>('PAYPAL_ADMIN_EMAIL', '');
    this.exchangeRateApiKey = this.configService.get<string>('EXCHANGE_RATE_API_KEY', '');
    
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('Thiếu thông tin xác thực PayPal. Vui lòng kiểm tra biến môi trường.');
    }
    
    this.baseUrl = mode === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  /**
   * Chuyển đổi tiền tệ từ VND sang USD
   * @param amountVND Số tiền VND cần chuyển đổi
   * @returns Số tiền USD tương ứng
   */
  async convertVNDtoUSD(amountVND: number): Promise<number> {
    try {
      this.logger.log(`Bắt đầu chuyển đổi ${amountVND} VND sang USD`);
      
      let url = `https://api.exchangerate.host/convert?from=VND&to=USD&amount=${amountVND}`;
      
      // Thêm API key nếu có
      if (this.exchangeRateApiKey) {
        url += `&access_key=${this.exchangeRateApiKey}`;
      }
      
      const response = await axios.get(url);
      
      // Kiểm tra trường hợp API không trả về success
      if (response.data && typeof response.data.success !== 'undefined' && !response.data.success) {
        this.logger.error(`Lỗi khi chuyển đổi tiền tệ: ${JSON.stringify(response.data)}`);
        
        // Sử dụng tỷ giá cố định nếu API không hoạt động (tỷ giá ước tính)
        // 1 USD = khoảng 24,000 VND (tỷ giá có thể thay đổi)
        const estimatedUSD = amountVND / 24000;
        this.logger.warn(`Sử dụng tỷ giá ước tính: ${estimatedUSD} USD`);
        return estimatedUSD;
      }
      
      // Xử lý trường hợp API không trả về kết quả định dạng mong đợi
      let amountUSD = 0;
      if (response.data && response.data.result) {
        amountUSD = response.data.result;
      } else if (response.data && response.data.rates && response.data.rates.USD) {
        // Đối với một số API exchangerate, có thể trả về định dạng khác
        amountUSD = amountVND * response.data.rates.USD;
      } else {
        // Tỷ giá ước tính nếu không thể lấy từ API
        amountUSD = amountVND / 24000;
        this.logger.warn(`Không thể xác định kết quả từ API, sử dụng tỷ giá ước tính: ${amountUSD} USD`);
      }
      
      this.logger.log(`Chuyển đổi thành công: ${amountVND} VND = ${amountUSD} USD`);
      
      return amountUSD;
    } catch (error) {
      this.logger.error(`Lỗi khi chuyển đổi tiền tệ: ${error.message}`);
      
      // Sử dụng tỷ giá cố định nếu có lỗi (tỷ giá ước tính)
      // 1 USD = khoảng 24,000 VND (tỷ giá có thể thay đổi)
      const estimatedUSD = amountVND / 24000;
      this.logger.warn(`Sử dụng tỷ giá ước tính: ${estimatedUSD} USD`);
      
      return estimatedUSD;
    }
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
   * Tạo thanh toán khóa học qua PayPal cho khách hàng
   */
  async createCustomerPayment(items: CartItem[], totalAmount: number, returnUrl: string, cancelUrl: string): Promise<PaypalPaymentResponse> {
    try {
      // Kiểm tra thông tin xác thực PayPal
      if (!this.clientId || !this.clientSecret) {
        this.logger.error('Thiếu thông tin xác thực PayPal. Vui lòng kiểm tra biến môi trường.');
        throw new Error('Thiếu thông tin xác thực PayPal');
      }

      // Kiểm tra email người nhận thanh toán
      if (!this.adminPaypalEmail) {
        this.logger.error('Thiếu email PayPal người nhận thanh toán. Vui lòng kiểm tra biến môi trường PAYPAL_ADMIN_EMAIL.');
        throw new Error('Thiếu email PayPal người nhận thanh toán');
      }

      // Kiểm tra tổng tiền
      if (totalAmount <= 0) {
        this.logger.error(`Tổng giá trị thanh toán không hợp lệ: ${totalAmount}`);
        throw new Error('Tổng giá trị thanh toán phải lớn hơn 0');
      }

      // Kiểm tra danh sách sản phẩm
      if (!items || items.length === 0) {
        this.logger.error('Danh sách sản phẩm rỗng');
        throw new Error('Danh sách sản phẩm không được rỗng');
      }

      // Kiểm tra URL chuyển hướng
      if (!returnUrl || !cancelUrl) {
        this.logger.error('Thiếu URL chuyển hướng');
        throw new Error('URL chuyển hướng không được để trống');
      }

      const accessToken = await this.getAccessToken();
      
      // Chuyển đổi giá tiền từ VND sang USD
      const convertedItems = await Promise.all(items.map(async (item) => {
        const priceUSD = await this.convertVNDtoUSD(item.price);
        return {
          ...item,
          priceUSD: priceUSD
        };
      }));
      
      // Tính tổng USD từ các item đã chuyển đổi
      const totalUSD = convertedItems.reduce((sum, item) => sum + item.priceUSD, 0);
      
      // Tính tỷ giá trung bình
      const exchangeRate = totalAmount / totalUSD;
      this.logger.log(`Tỷ giá chuyển đổi trung bình: 1 USD = ${exchangeRate.toFixed(2)} VND`);
      
      // Tạo danh sách item trong PayPal
      const purchaseItems = convertedItems.map(item => ({
        name: item.name.substring(0, 127), // Giới hạn độ dài tên sản phẩm
        unit_amount: {
          currency_code: 'USD',
          value: parseFloat(item.priceUSD.toFixed(2)).toString()
        },
        quantity: '1',
        category: 'DIGITAL_GOODS'
      }));
      
      // Tính lại tổng giá từ các item để đảm bảo không có sự khác biệt do làm tròn
      const recalculatedTotal = purchaseItems.reduce((sum, item) => {
        return sum + parseFloat(item.unit_amount.value);
      }, 0);
      
      // Làm tròn lại tổng giá mới tính
      const formattedTotal = parseFloat(recalculatedTotal.toFixed(2));
      this.logger.log(`Tổng giá trị đơn hàng sau khi tính lại: ${formattedTotal} USD (từ ${totalAmount} VND)`);
      
      // Log dữ liệu gửi đi để debug
      const requestPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: formattedTotal.toString(),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: formattedTotal.toString()
                }
              }
            },
            payee: {
              email_address: this.adminPaypalEmail
            },
            items: purchaseItems,
            description: 'Thanh toán khóa học trực tuyến'
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          brand_name: 'Mentora Learning Platform',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING'
        },
      };
      
      this.logger.log(`Gửi yêu cầu tạo thanh toán đến PayPal: ${JSON.stringify(requestPayload)}`);
      
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `order-${Date.now()}-${Math.floor(Math.random() * 1000)}` // Thêm request ID để tránh trùng lặp
          },
        },
      );
      
      this.logger.log(`Phản hồi từ PayPal: ${JSON.stringify(response.data)}`);
      
      // Trích xuất thông tin từ phản hồi của PayPal
      const paymentId = response.data.id;
      const approvalLink = response.data.links.find(link => link.rel === 'approve');
      
      if (!approvalLink) {
        this.logger.error('Không tìm thấy link phê duyệt trong phản hồi từ PayPal');
        throw new Error('Không tìm thấy link phê duyệt trong phản hồi từ PayPal');
      }
      
      const approvalUrl = approvalLink.href;
      const status = response.data.status;

      return {
        paymentId,
        approvalUrl,
        status,
        totalAmountUSD: formattedTotal,
        exchangeRate,
        originalCurrency: 'VND'
      };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo thanh toán PayPal cho khách hàng: ${error.message}`);
      
      // Xử lý lỗi từ PayPal API
      if (error.response) {
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        this.logger.error(`Chi tiết lỗi từ PayPal [${statusCode}]: ${JSON.stringify(responseData)}`);
        
        // Xử lý các mã lỗi phổ biến
        if (statusCode === 401) {
          throw new Error('Lỗi xác thực với PayPal, vui lòng kiểm tra cấu hình');
        } else if (statusCode === 422) {
          // Trích xuất thông tin lỗi 422 chi tiết hơn
          let errorDetails = 'Dữ liệu không hợp lệ';
          
          if (responseData && responseData.details) {
            errorDetails = responseData.details.map(detail => 
              `${detail.issue || ''}: ${detail.description || ''} (${detail.field || 'unknown field'})`
            ).join('; ');
          }
          
          throw new Error(`Lỗi dữ liệu: ${errorDetails}`);
        }
      }
      
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
      
      return {
        success: true,
        paymentId: response.data.id,
        details: response.data
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xác nhận thanh toán PayPal: ${error.message}`, error.stack);
      
      // Kiểm tra nếu lỗi đến từ PayPal API
      if (error.response && error.response.data) {
        this.logger.error(`Chi tiết lỗi từ PayPal: ${JSON.stringify(error.response.data)}`);
        
        return {
          success: false,
          error: `Lỗi từ PayPal: ${error.response.data.message || error.response.data.error_description || JSON.stringify(error.response.data)}`,
          details: error.response.data
        };
      }
      
      return {
        success: false,
        error: `Lỗi khi xác nhận thanh toán PayPal: ${error.message}`
      };
    }
  }
}