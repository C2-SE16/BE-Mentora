import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaypalService } from './paypal.service';
import { RedisService } from '../../common/cache/redis.service';
import { CartService } from '../../common/services/cart.service';
import { CourseEnrollmentService } from '../../common/services/course-enrollment.service';
import { v4 as uuidv4 } from 'uuid';
import { 
  CartItem, 
  OrderRecord, 
  PaymentResult, 
  PaymentCaptureResult 
} from '../interfaces/customer-payment.interface';
import { InitiateCustomerPaymentDto, CaptureCustomerPaymentDto } from '../dto/customer-payment.dto';

// Định nghĩa kiểu CartItem cho Redis
interface RedisCartItem {
  courseId: string;
  selected: boolean;
}

@Injectable()
export class CustomerPaymentService {
  private readonly logger = new Logger(CustomerPaymentService.name);
  private readonly ORDER_PREFIX = 'order:';
  private readonly PAYMENT_DETAILS_PREFIX = 'payment_details:';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly paypalService: PaypalService,
    private readonly redisService: RedisService,
    private readonly cartService: CartService,
    private readonly courseEnrollmentService: CourseEnrollmentService,
  ) {
    // Kiểm tra kết nối Redis khi khởi tạo service
    this.checkRedisConnection();
  }

  private async checkRedisConnection() {
    try {
      // Thử lưu và đọc một giá trị test
      const testKey = 'test:connection';
      await this.redisService.set(testKey, 'test', 10);
      const value = await this.redisService.get(testKey);
      if (value === 'test') {
        this.logger.log('Kết nối Redis thành công');
      } else {
        this.logger.error('Kết nối Redis không ổn định');
      }
    } catch (error) {
      this.logger.error('Không thể kết nối đến Redis:', error);
    }
  }

  private async getFromRedisWithRetry<T>(key: string, retries = 3): Promise<T | null> {
    this.logger.log(`[REDIS-DEBUG] Bắt đầu đọc dữ liệu từ Redis với key: ${key}, số lần thử: ${retries}`);
    
    for (let i = 0; i < retries; i++) {
      try {
        this.logger.log(`[REDIS-DEBUG] Lần thử ${i + 1}: Đang đọc key ${key}`);
        const value = await this.redisService.get<T>(key);
        
        if (value !== null) {
          this.logger.log(`[REDIS-DEBUG] Đọc dữ liệu từ Redis thành công. Key: ${key}`);
          return value;
        }
        
        this.logger.warn(`[REDIS-DEBUG] Không tìm thấy dữ liệu trong Redis. Key: ${key}, Lần thử: ${i + 1}`);
        
        // Kiểm tra xem key có tồn tại không
        const exists = await this.redisService.exists(key);
        this.logger.log(`[REDIS-DEBUG] Kiểm tra tồn tại key ${key}: ${exists ? 'TỒN TẠI' : 'KHÔNG TỒN TẠI'}`);
        
        if (exists) {
          this.logger.warn(`[REDIS-DEBUG] Key tồn tại nhưng không thể đọc giá trị. Có thể là vấn đề với định dạng dữ liệu.`);
          // Thử lấy giá trị dưới dạng chuỗi và phân tích
          try {
            const rawValue = await this.redisService.get<string>(key);
            if (rawValue) {
              try {
                const parsedValue = JSON.parse(rawValue);
                this.logger.log(`[REDIS-DEBUG] Đã phân tích thành công dữ liệu từ chuỗi JSON. Key: ${key}`);
                return parsedValue as T;
              } catch (parseError) {
                this.logger.error(`[REDIS-DEBUG] Lỗi phân tích JSON: ${parseError.message}`);
              }
            }
          } catch (rawError) {
            this.logger.error(`[REDIS-DEBUG] Lỗi khi lấy dữ liệu thô: ${rawError.message}`);
          }
        }
        
        // Tìm tất cả các key có mẫu tương tự
        const allKeys = await this.redisService.keys(`${key.split(':')[0]}:*`);
        this.logger.log(`[REDIS-DEBUG] Tất cả các key có pattern tương tự: ${JSON.stringify(allKeys)}`);
        
        // Kiểm tra trong database nếu key liên quan đến đơn hàng hoặc thanh toán
        if (key.startsWith(this.PAYMENT_DETAILS_PREFIX)) {
          const paymentId = key.replace(this.PAYMENT_DETAILS_PREFIX, '');
          this.logger.log(`[REDIS-DEBUG] Thử tìm dữ liệu thanh toán trong database với paymentId: ${paymentId}`);
          try {
            // Thử tìm trong database
            const paymentRecord = await this.prismaService.tbl_payment.findFirst({
              where: { paymentId }
            });
            
            if (paymentRecord) {
              this.logger.log(`[REDIS-DEBUG] Tìm thấy dữ liệu thanh toán trong database. PaymentId: ${paymentId}`);
              // Tái tạo thông tin chi tiết từ database
              const paymentDetails = {
                orderId: paymentRecord.transactionId || 'unknown',
                status: paymentRecord.status || 'UNKNOWN',
                createdAt: paymentRecord.createdAt ? paymentRecord.createdAt.toISOString() : new Date().toISOString()
              };
              
              // Lưu lại vào Redis để sử dụng sau này
              await this.setToRedisWithRetry(key, paymentDetails, 7200);
              
              return paymentDetails as T;
            }
          } catch (dbError) {
            this.logger.error(`[REDIS-DEBUG] Lỗi khi tìm trong database: ${dbError.message}`);
          }
        }
        
        if (i < retries - 1) {
          this.logger.log(`[REDIS-DEBUG] Đợi 1 giây trước khi thử lại lần ${i + 2}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        this.logger.error(`[REDIS-DEBUG] Lỗi khi đọc từ Redis. Key: ${key}, Lần thử: ${i + 1}, Lỗi: ${error.message}`, error.stack);
        
        if (i < retries - 1) {
          this.logger.log(`[REDIS-DEBUG] Đợi 1 giây trước khi thử lại lần ${i + 2}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    this.logger.error(`[REDIS-DEBUG] Không thể đọc dữ liệu sau ${retries} lần thử. Key: ${key}`);
    return null;
  }

  private async setToRedisWithRetry(key: string, value: any, ttl: number, retries = 3): Promise<boolean> {
    this.logger.log(`[REDIS-DEBUG] Bắt đầu lưu dữ liệu vào Redis. Key: ${key}, TTL: ${ttl}s, Giá trị: ${JSON.stringify(value)}`);
    for (let i = 0; i < retries; i++) {
      try {
        await this.redisService.set(key, value, ttl);
        this.logger.log(`[REDIS-DEBUG] Lưu dữ liệu vào Redis thành công. Key: ${key}, TTL: ${ttl}s`);
        
        // Kiểm tra xác nhận dữ liệu đã được lưu
        try {
          const savedValue = await this.redisService.get(key);
          const ttlRemaining = await this.redisService.ttl(key);
          this.logger.log(`[REDIS-DEBUG] Xác nhận lưu trữ - Key: ${key}, Đã lưu: ${savedValue ? 'CÓ' : 'KHÔNG'}, TTL còn lại: ${ttlRemaining}s`);
        } catch (verifyError) {
          this.logger.error(`[REDIS-DEBUG] Lỗi khi xác nhận lưu trữ: ${verifyError.message}`);
        }
        
        return true;
      } catch (error) {
        this.logger.error(`[REDIS-DEBUG] Lỗi khi lưu vào Redis. Key: ${key}, Lần thử: ${i + 1}, Lỗi: ${error.message}`, error.stack);
      }
      // Đợi 1 giây trước khi thử lại
      this.logger.log(`[REDIS-DEBUG] Đợi 1 giây trước khi thử lưu lại lần ${i + 2}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.logger.error(`[REDIS-DEBUG] Không thể lưu dữ liệu sau ${retries} lần thử. Key: ${key}`);
    return false;
  }

  private getOrderKey(orderId: string): string {
    return `${this.ORDER_PREFIX}${orderId}`;
  }

  private getPaymentDetailsKey(paymentId: string): string {
    return `${this.PAYMENT_DETAILS_PREFIX}${paymentId || ''}`;
  }

  private getCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  /**
   * Lấy thông tin giỏ hàng từ Redis và tính tổng tiền
   */
  private async getCartItemsAndTotal(userId: string): Promise<{ items: CartItem[], total: number }> {
    this.logger.log(`[REDIS-DEBUG] Bắt đầu lấy giỏ hàng cho userId: ${userId}`);
    
    // Lấy danh sách khóa học đã chọn
    const selectedCart = await this.cartService.getSelectedCartItems({ userId });
    console.log('selectedCart:::', selectedCart);
    if (!selectedCart || !selectedCart.courses || selectedCart.courses.length === 0) {
      this.logger.warn(`[REDIS-DEBUG] Không có khóa học nào được chọn để thanh toán cho userId: ${userId}`);
      throw new BadRequestException('Không có khóa học nào được chọn để thanh toán');
    }

    const items: CartItem[] = selectedCart.courses.map(course => ({
      courseId: course.courseId,
      name: course.title || 'Khóa học',
      price: course.finalPrice ? Number(course.finalPrice) : 0,
      currencyCode: 'VND'  // Thêm thông tin tiền tệ VND
    }));

    const total = items.reduce((sum, item) => sum + item.price, 0);
    this.logger.log(`[REDIS-DEBUG] Lấy khóa học đã chọn thành công. Tổng số item: ${items.length}, Tổng tiền: ${total} VND`);

    return { items, total };
  }

  /**
   * Khởi tạo thanh toán cho khách hàng
   */
  async initiatePayment(dto: InitiateCustomerPaymentDto): Promise<PaymentResult> {
    try {
      const { userId, returnUrl, cancelUrl } = dto;
      this.logger.log(`Bắt đầu khởi tạo thanh toán cho userId: ${userId}`);

      if (!userId) {
        this.logger.error('UserId không được để trống');
        throw new BadRequestException('UserId không được để trống');
      }

      // Kiểm tra các URL
      if (!returnUrl || !cancelUrl) {
        this.logger.error('URL chuyển hướng không được để trống');
        throw new BadRequestException('URL chuyển hướng không được để trống');
      }

      // Lấy thông tin giỏ hàng từ Redis
      this.logger.log('Đang lấy thông tin giỏ hàng từ Redis...');
      const { items, total } = await this.getCartItemsAndTotal(userId);
      this.logger.log(`Tổng số khóa học trong giỏ hàng: ${items.length}, Tổng tiền: ${total} VND (sẽ được chuyển đổi sang USD khi thanh toán qua PayPal)`);

      if (total <= 0) {
        this.logger.error('Tổng giá trị giỏ hàng phải lớn hơn 0');
        throw new BadRequestException('Tổng giá trị giỏ hàng phải lớn hơn 0');
      }

      // Tạo đơn hàng trên PayPal
      this.logger.log('Đang tạo đơn hàng trên PayPal với chuyển đổi từ VND sang USD...');
      try {
        const paypalResult = await this.paypalService.createCustomerPayment(
          items,
          total,
          returnUrl,
          cancelUrl
        );
        this.logger.log(`Đã tạo đơn hàng PayPal thành công. PaymentId: ${paypalResult.paymentId}`);

        // Tạo mã đơn hàng mới
        const orderId = uuidv4();
        this.logger.log(`Tạo mã đơn hàng mới: ${orderId}`);
        
        // Lấy giá USD và tỷ giá chuyển đổi
        const exchangeRate = (paypalResult as any).exchangeRate || null;
        const totalAmountUSD = (paypalResult as any).totalAmountUSD || null;
        
        if (exchangeRate && totalAmountUSD) {
          this.logger.log(`Tỷ giá chuyển đổi: 1 USD = ${exchangeRate} VND, Tổng tiền: ${total} VND = ${totalAmountUSD} USD`);
        }
        
        // Lưu thông tin đơn hàng vào Redis
        const orderRecord: OrderRecord = {
          orderId,
          userId,
          totalAmount: total,
          currencyCode: 'VND',
          exchangeRate: exchangeRate,
          totalAmountUSD: totalAmountUSD,
          paymentId: paypalResult.paymentId,
          status: 'PENDING',
          items: items.map(item => ({
            courseId: item.courseId,
            price: item.price,
            priceUSD: item.priceUSD
          })),
          createdAt: new Date(),
        };

        // Lưu thông tin vào database tạm thời để ngăn ngừa mất dữ liệu Redis
        this.logger.log('[REDIS-DEBUG] Lưu trữ thông tin đơn hàng song song vào database...');
        try {
          // Tạo bản ghi tạm trong database
          await this.prismaService.tbl_payment_temp.create({
            data: {
              tempId: uuidv4(),
              paymentId: paypalResult.paymentId,
              orderId: orderId,
              userId: userId,
              amount: total,
              status: 'PENDING',
              paymentData: JSON.stringify(orderRecord),
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 7200 * 1000) // 2 giờ
            }
          });
          this.logger.log('[REDIS-DEBUG] Đã lưu trữ thông tin đơn hàng vào database tạm thời');
        } catch (dbError) {
          this.logger.error(`[REDIS-DEBUG] Lỗi khi lưu vào database tạm: ${dbError.message}`, dbError.stack);
          // Không ném lỗi ở đây, tiếp tục quy trình
        }

        // Lưu vào Redis với thời hạn 2 giờ
        this.logger.log('Đang lưu thông tin đơn hàng vào Redis...');
        const orderSaved = await this.setToRedisWithRetry(
          this.getOrderKey(orderId),
          orderRecord,
          7200 // 2 giờ
        );

        if (!orderSaved) {
          throw new Error('Không thể lưu thông tin đơn hàng vào Redis');
        }

        // Liên kết paymentId với orderId
        const paymentDetails = { 
          orderId, 
          status: 'PENDING', 
          createdAt: new Date(),
          currencyCode: 'VND',
          totalAmount: total,
          totalAmountUSD: totalAmountUSD,
          exchangeRate: exchangeRate
        };
        
        this.logger.log(`[REDIS-DEBUG] Lưu thông tin liên kết paymentId-orderId. PaymentId: ${paypalResult.paymentId}, OrderId: ${orderId}, Chi tiết: ${JSON.stringify(paymentDetails)}`);
        
        const paymentDetailsKey = this.getPaymentDetailsKey(paypalResult.paymentId);
        const paymentDetailsSaved = await this.setToRedisWithRetry(
          paymentDetailsKey,
          paymentDetails,
          7200 // 2 giờ
        );

        if (!paymentDetailsSaved) {
          throw new Error('Không thể lưu thông tin thanh toán vào Redis');
        }

        this.logger.log(`Đã lưu thông tin thanh toán vào Redis. Key: ${paymentDetailsKey}`);

        return {
          success: true,
          paymentId: paypalResult.paymentId,
          approvalUrl: paypalResult.approvalUrl
        };
      } catch (paypalError) {
        // Xử lý lỗi từ PayPal
        this.logger.error(`Lỗi khi tạo thanh toán trên PayPal: ${paypalError.message}`, paypalError.stack);
        
        // Kiểm tra xem có thông tin lỗi chi tiết không
        if (paypalError.message && paypalError.message.includes('Lỗi dữ liệu:')) {
          return {
            success: false,
            error: paypalError.message
          };
        }
        
        // Xử lý các lỗi khác
        return {
          success: false,
          error: `Lỗi khi tạo thanh toán trên PayPal: ${paypalError.message}`
        };
      }
    } catch (error) {
      this.logger.error(`Lỗi khi khởi tạo thanh toán: ${error.message}`, error.stack);
      
      // Nếu là lỗi BadRequestException, giữ nguyên message
      if (error instanceof BadRequestException) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: `Lỗi khi khởi tạo thanh toán: ${error.message}`
      };
    }
  }

  /**
   * Xử lý sau khi thanh toán thành công
   */
  private async handleSuccessfulPayment(userId: string, items: any[]): Promise<void> {
    try {
      this.logger.log(`Xử lý sau khi thanh toán thành công cho userId: ${userId}`);
      
      // Lấy danh sách ID của các khóa học đã thanh toán
      const paidCourseIds = items.map(item => item.courseId);
      this.logger.log(`Các khóa học đã thanh toán: ${paidCourseIds.join(', ')}`);
      
      if (!paidCourseIds.length) {
        this.logger.warn('Không có khóa học nào để xóa khỏi giỏ hàng');
        return;
      }
      
      // Cách 1: Sử dụng cartService để xóa khỏi cả database và Redis
      try {
        await this.cartService.removeCoursesFromDatabaseCart(userId, paidCourseIds);
        this.logger.log(`[CÁCH 1] Đã xóa ${paidCourseIds.length} khóa học khỏi giỏ hàng bằng removeCoursesFromDatabaseCart`);
      } catch (dbError) {
        this.logger.error(`[CÁCH 1] Lỗi khi xóa khóa học khỏi database: ${dbError.message}`, dbError.stack);
        
        // Cách 2: Thử xóa trực tiếp từ Redis nếu Cách 1 thất bại
        try {
          // Xóa các khóa học đã thanh toán khỏi giỏ hàng trong Redis 
          const cartKey = this.getCartKey(userId);
          
          // Lấy giỏ hàng hiện tại từ Redis
          let currentCart = await this.redisService.get<any>(cartKey);
          this.logger.log(`[CÁCH 2] Giỏ hàng hiện tại trong Redis: ${JSON.stringify(currentCart)}`);
          
          // Chuyển đổi giỏ hàng từ chuỗi JSON nếu cần
          if (typeof currentCart === 'string') {
            try {
              currentCart = JSON.parse(currentCart);
            } catch (e) {
              this.logger.error(`[CÁCH 2] Lỗi khi phân tích chuỗi JSON: ${e.message}`);
              currentCart = [];
            }
          } else if (!currentCart) {
            currentCart = [];
          }
          
          // Lọc giỏ hàng để giữ lại các khóa học chưa thanh toán
          let updatedCart;
          if (Array.isArray(currentCart) && currentCart.length > 0 && typeof currentCart[0] === 'object' && currentCart[0].courseId) {
            // Định dạng là mảng các đối tượng { courseId: string, selected: boolean }
            updatedCart = currentCart.filter(item => !paidCourseIds.includes(item.courseId));
          } else if (Array.isArray(currentCart)) {
            // Định dạng là mảng các chuỗi courseId
            updatedCart = currentCart.filter(courseId => !paidCourseIds.includes(courseId));
          } else {
            updatedCart = [];
          }
          
          this.logger.log(`[CÁCH 2] Giỏ hàng sau khi lọc: ${JSON.stringify(updatedCart)}`);
          this.logger.log(`[CÁCH 2] Đã xóa ${Array.isArray(currentCart) ? currentCart.length - updatedCart.length : 0} khóa học khỏi giỏ hàng`);
          
          // Cập nhật giỏ hàng trong Redis
          await this.redisService.set(cartKey, updatedCart);
          
          // Xóa cache voucher
          try {
            await this.redisService.del(`${cartKey}:voucher`);
            this.logger.log(`[CÁCH 2] Đã xóa cache voucher cho giỏ hàng`);
          } catch (voucherError) {
            this.logger.error(`[CÁCH 2] Lỗi khi xóa cache voucher: ${voucherError.message}`);
          }
          
          // Kiểm tra xem giỏ hàng đã được cập nhật chưa
          const updatedCartCheck = await this.redisService.get<any>(cartKey);
          this.logger.log(`[CÁCH 2] Giỏ hàng sau khi cập nhật trong Redis: ${JSON.stringify(updatedCartCheck)}`);
        } catch (redisError) {
          this.logger.error(`[CÁCH 2] Lỗi khi xóa trực tiếp từ Redis: ${redisError.message}`, redisError.stack);
        }
      }
      
      // Cách 3: Xóa trạng thái đã chọn (luôn thực hiện dù Cách 1 thành công hay thất bại)
      try {
        await this.cartService.clearSelectedCartItems(userId);
        this.logger.log(`[CÁCH 3] Đã xóa trạng thái chọn của tất cả khóa học`);
      } catch (selectError) {
        this.logger.error(`[CÁCH 3] Lỗi khi xóa trạng thái đã chọn: ${selectError.message}`, selectError.stack);
      }
      
      // Cách 4: Xóa toàn bộ giỏ hàng nếu tất cả sản phẩm đã được thanh toán
      try {
        const cartKey = this.getCartKey(userId);
        let currentCart = await this.redisService.get<any>(cartKey);
        
        if (!currentCart || (Array.isArray(currentCart) && currentCart.length === 0)) {
          await this.redisService.del(cartKey);
          await this.redisService.del(`${cartKey}:voucher`);
          this.logger.log(`[CÁCH 4] Đã xóa hoàn toàn giỏ hàng và voucher cache trong Redis vì giỏ hàng trống`);
        }
      } catch (error) {
        this.logger.error(`[CÁCH 4] Lỗi khi kiểm tra/xóa giỏ hàng trống: ${error.message}`, error.stack);
      }
      
      this.logger.log(`Đã hoàn tất xử lý giỏ hàng sau khi thanh toán.`);
    } catch (error) {
      this.logger.error(`Lỗi khi xử lý sau thanh toán: ${error.message}`, error.stack);
      // Không ném lỗi ở đây để không ảnh hưởng đến quá trình thanh toán
    }
  }

  /**
   * Xác nhận thanh toán sau khi người dùng đã chấp nhận thanh toán trên PayPal
   */
  async capturePayment(dto: CaptureCustomerPaymentDto): Promise<PaymentCaptureResult> {
    try {
      this.logger.log(`Bắt đầu xác nhận thanh toán. PaymentId: ${dto.token}`);
      const { token, userId } = dto;

      if (!token) {
        throw new BadRequestException('Token thanh toán không được để trống');
      }

      // Lấy thông tin thanh toán từ Redis
      this.logger.log(`[REDIS-DEBUG] Lấy thông tin chi tiết thanh toán cho token: ${token}`);
      const paymentDetails = await this.getFromRedisWithRetry<any>(this.getPaymentDetailsKey(token));
      
      if (!paymentDetails) {
        this.logger.error(`[REDIS-DEBUG] Không tìm thấy thông tin thanh toán trong Redis cho token: ${token}`);
        
        // Kiểm tra xem đây có phải là thanh toán đã được xử lý trước đó không
        let existingPayment = false;
        
        // Nếu là token từ PayPal (không phải UUID)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
          try {
            // Tìm kiếm bằng transactionId (không yêu cầu UUID format)
            const paymentsByTransaction = await this.prismaService.$queryRaw`
              SELECT * FROM tbl_payment 
              WHERE "transactionId" = ${token}
            `;
            
            if (Array.isArray(paymentsByTransaction) && paymentsByTransaction.length > 0) {
              const payment = paymentsByTransaction[0];
              this.logger.log(`[RECOVERY] Tìm thấy thanh toán trong database với transactionId: ${token}`);
              
              if (payment.status === 'COMPLETED') {
                this.logger.log(`[RECOVERY] Thanh toán đã được xử lý trước đó. PaymentId: ${payment.paymentId}`);
                existingPayment = true;
                
                return {
                  success: true,
                  paymentId: payment.paymentId,
                  details: {
                    message: 'Thanh toán đã được xử lý trước đó',
                    status: 'COMPLETED'
                  }
                };
              }
            }
          } catch (sqlError) {
            this.logger.error(`[RECOVERY] Lỗi khi truy vấn SQL: ${sqlError.message}`, sqlError.stack);
          }
          
          // Tìm kiếm trong database tạm
          try {
            const tempPayment = await this.prismaService.$queryRaw`
              SELECT * FROM tbl_payment_temp 
              WHERE "paymentId" = ${token}
            `;
            
            if (Array.isArray(tempPayment) && tempPayment.length > 0) {
              const tempOrder = tempPayment[0];
              this.logger.log(`[RECOVERY] Tìm thấy đơn hàng tạm trong database với paymentId: ${token}`);
              
              try {
                // Phục hồi thông tin đơn hàng từ dữ liệu JSON
                if (tempOrder.paymentData) {
                  const orderData = JSON.parse(tempOrder.paymentData as string);
                  this.logger.log(`[RECOVERY] Đã phục hồi dữ liệu đơn hàng từ database tạm. OrderId: ${tempOrder.orderId}`);
                  
                  // Lưu lại vào Redis
                  const orderKey = this.getOrderKey(tempOrder.orderId);
                  await this.setToRedisWithRetry(orderKey, orderData, 7200);
                  
                  // Xác nhận thanh toán với PayPal
                  this.logger.log('[RECOVERY] Gọi PayPal API để xác nhận thanh toán...');
                  
                  try {
                    const captureResult = await this.paypalService.capturePayment(token);
                    
                    if (!captureResult.success) {
                      this.logger.error(`[RECOVERY] Lỗi xác nhận thanh toán từ PayPal: ${captureResult.error}`);
                      throw new BadRequestException(captureResult.error || 'Lỗi khi xác nhận thanh toán với PayPal');
                    }
                    
                    // Xử lý thanh toán thành công
                    const userIdFromTemp = tempOrder.userId || userId;
                    await this.processSuccessfulPayment(token, captureResult, userIdFromTemp, orderData);
                    
                    existingPayment = true;
                    return {
                      success: true,
                      paymentId: captureResult.paymentId,
                      details: captureResult.details
                    };
                  } catch (paypalError) {
                    this.logger.error(`[RECOVERY] Lỗi khi xác nhận với PayPal: ${paypalError.message}`, paypalError.stack);
                    throw new BadRequestException(`Lỗi khi xác nhận thanh toán: ${paypalError.message}`);
                  }
                }
              } catch (parseError) {
                this.logger.error(`[RECOVERY] Lỗi khi xử lý dữ liệu tạm: ${parseError.message}`, parseError.stack);
              }
            }
          } catch (tempSqlError) {
            this.logger.error(`[RECOVERY] Lỗi khi truy vấn SQL bảng tạm: ${tempSqlError.message}`, tempSqlError.stack);
          }
        }
        
        if (!existingPayment) {
          throw new BadRequestException('Không tìm thấy thông tin thanh toán hoặc thanh toán đã hết hạn');
        }
      }
      
      this.logger.log(`[REDIS-DEBUG] Tìm thấy thông tin thanh toán: ${JSON.stringify(paymentDetails)}`);
      
      // Kiểm tra nếu thanh toán đã được xử lý trước đó
      if (paymentDetails.status === 'COMPLETED') {
        this.logger.log(`[REDIS-DEBUG] Thanh toán này đã được xử lý trước đó: ${token}`);
        return {
          success: true,
          paymentId: token,
          details: {
            message: 'Thanh toán đã được xử lý trước đó',
            status: 'COMPLETED'
          }
        };
      }
      
      // Lấy thông tin đơn hàng
      this.logger.log(`[REDIS-DEBUG] Lấy thông tin đơn hàng từ Redis. OrderId: ${paymentDetails.orderId}`);
      const orderKey = this.getOrderKey(paymentDetails.orderId);
      const orderRecord = await this.getFromRedisWithRetry<OrderRecord>(orderKey);
      
      if (!orderRecord) {
        this.logger.error(`[REDIS-DEBUG] Không tìm thấy thông tin đơn hàng trong Redis. OrderId: ${paymentDetails.orderId}`);
        
        // Tìm kiếm trong database tạm
        const tempOrder = await this.prismaService.tbl_payment_temp.findFirst({
          where: { paymentId: token }
        });
        
        if (tempOrder) {
          try {
            const orderData = JSON.parse(tempOrder.paymentData as string) as OrderRecord;
            this.logger.log(`[RECOVERY] Đã phục hồi thông tin đơn hàng từ database tạm: ${tempOrder.orderId}`);
            
            // Lưu lại vào Redis
            await this.setToRedisWithRetry(orderKey, orderData, 7200);
            
            // Sử dụng dữ liệu từ database tạm để tiếp tục
            const userIdFromDb = orderData.userId || tempOrder.userId || '';
            
            // Đảm bảo userId từ yêu cầu khớp với userId trong database
            if (userId && userIdFromDb && userId !== userIdFromDb) {
              this.logger.warn(`[SECURITY] UserId không khớp. Yêu cầu: ${userId}, DB: ${userIdFromDb}`);
              throw new BadRequestException('UserId không hợp lệ cho thanh toán này');
            }
            
            // Tiếp tục xử lý với dữ liệu phục hồi
            this.logger.log(`[RECOVERY] Đang tiếp tục xử lý với dữ liệu phục hồi, userId: ${userIdFromDb}`);
            
            // Xác nhận thanh toán với PayPal
            this.logger.log('Gọi PayPal API để xác nhận thanh toán...');
            const captureResult = await this.paypalService.capturePayment(token);
            
            if (!captureResult.success) {
              this.logger.error(`Lỗi xác nhận thanh toán từ PayPal: ${captureResult.error}`);
              return captureResult;
            }
            
            // Xử lý dữ liệu đã phục hồi
            await this.processSuccessfulPayment(token, captureResult, userIdFromDb, orderData);
            
            return {
              success: true,
              paymentId: captureResult.paymentId,
              details: captureResult.details
            };
          } catch (parseError) {
            this.logger.error(`[RECOVERY] Lỗi khi phân tích dữ liệu phục hồi: ${parseError.message}`);
          }
        }
        
        throw new NotFoundException('Không tìm thấy thông tin đơn hàng hoặc đơn hàng đã hết hạn');
      }
      
      this.logger.log(`[REDIS-DEBUG] Đã tìm thấy thông tin đơn hàng: ${JSON.stringify(orderRecord)}`);
      
      // Đảm bảo userId từ yêu cầu khớp với userId trong đơn hàng
      if (userId && orderRecord.userId && userId !== orderRecord.userId) {
        this.logger.warn(`[SECURITY] UserId không khớp. Yêu cầu: ${userId}, Đơn hàng: ${orderRecord.userId}`);
        throw new BadRequestException('UserId không hợp lệ cho thanh toán này');
      }

      // Xác nhận thanh toán với PayPal
      this.logger.log('Gọi PayPal API để xác nhận thanh toán...');
      const captureResult = await this.paypalService.capturePayment(token);
      this.logger.log(`Kết quả xác nhận từ PayPal: ${JSON.stringify(captureResult)}`);

      if (!captureResult.success) {
        this.logger.error(`Lỗi xác nhận thanh toán từ PayPal: ${captureResult.error}`);
        return captureResult;
      }

      // Xử lý thanh toán thành công
      await this.processSuccessfulPayment(token, captureResult, orderRecord.userId, orderRecord);

      return {
        success: true,
        paymentId: captureResult.paymentId,
        details: captureResult.details
      };
      
    } catch (error) {
      this.logger.error(`Lỗi xác nhận thanh toán: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || null
      };
    }
  }
  
  /**
   * Xử lý thanh toán thành công
   */
  private async processSuccessfulPayment(token: string, captureResult: any, userId: string, orderRecord: OrderRecord): Promise<void> {
    // Cập nhật trạng thái đơn hàng
    this.logger.log('Cập nhật trạng thái đơn hàng thành COMPLETED');
    orderRecord.status = 'COMPLETED';
    orderRecord.completedAt = new Date();
    
    // Thêm thông tin về tiền tệ và tỷ giá nếu chưa có
    if (!orderRecord.currencyCode) {
      orderRecord.currencyCode = 'VND';
    }
    
    // Ghi log về việc chuyển đổi tiền tệ
    if (orderRecord.totalAmountUSD) {
      this.logger.log(`Thanh toán thành công: ${orderRecord.totalAmount} ${orderRecord.currencyCode} (tương đương ${orderRecord.totalAmountUSD} USD với tỷ giá ${orderRecord.exchangeRate || 'không xác định'})`);
    }
    
    // Cập nhật đơn hàng trong Redis
    const orderKey = this.getOrderKey(orderRecord.orderId);
    await this.setToRedisWithRetry(orderKey, orderRecord, 86400); // 24 giờ
    
    // Cập nhật thông tin thanh toán
    const paymentDetailsKey = this.getPaymentDetailsKey(token);
    const paymentDetails = { 
      orderId: orderRecord.orderId, 
      status: 'COMPLETED',
      completedAt: new Date(),
      currencyCode: orderRecord.currencyCode,
      totalAmount: orderRecord.totalAmount,
      totalAmountUSD: orderRecord.totalAmountUSD,
      exchangeRate: orderRecord.exchangeRate
    };
    await this.setToRedisWithRetry(paymentDetailsKey, paymentDetails, 86400); // 24 giờ

    // Lưu thông tin thanh toán vào database
    this.logger.log('Lưu thông tin thanh toán vào database...');
    try {
      // Kiểm tra xem thanh toán đã tồn tại chưa
      let existingPayment: any = null;
      
      // Sử dụng raw query để tránh lỗi UUID
      try {
        this.logger.log(`Kiểm tra thanh toán tồn tại với token: ${token}, PaymentId: ${captureResult.paymentId}`);
        const payments = await this.prismaService.$queryRaw`
          SELECT * FROM tbl_payment 
          WHERE "transactionId" = ${token} OR "paymentId" = ${captureResult.paymentId}
        `;
        
        if (Array.isArray(payments) && payments.length > 0) {
          existingPayment = payments[0];
        }
      } catch (sqlError) {
        this.logger.error(`Lỗi khi kiểm tra thanh toán tồn tại: ${sqlError.message}`, sqlError.stack);
      }
      
      let paymentUuid = captureResult.paymentId;
      
      if (existingPayment) {
        this.logger.log(`Thanh toán đã tồn tại trong database. ${JSON.stringify(existingPayment)}`);
        paymentUuid = existingPayment.paymentId;
      } else {
        // Tạo UUID mới cho paymentId nếu cần
        paymentUuid = captureResult.paymentId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(captureResult.paymentId)
          ? captureResult.paymentId
          : uuidv4();
        
        this.logger.log(`Chuẩn bị tạo bản ghi thanh toán mới với paymentId: ${paymentUuid}`);
        
        // Chuẩn bị metadata chứa thông tin tỷ giá và chuyển đổi
        const metadata = JSON.stringify({
          originalAmount: orderRecord.totalAmount,
          originalCurrency: orderRecord.currencyCode || 'VND',
          exchangeRate: orderRecord.exchangeRate,
          usdAmount: orderRecord.totalAmountUSD
        });
        
        this.logger.log(`Metadata thanh toán: ${metadata}`);
        
        try {
          // Tạo bản ghi thanh toán với raw query, thêm metadata
          const newPayment = await this.prismaService.$executeRaw`
            INSERT INTO tbl_payment ("paymentId", "userId", "amount", "status", "paymentMethod", "transactionId", "createdAt", "metadata")
            VALUES (${paymentUuid}, ${userId || ''}, ${orderRecord.totalAmount}, 'COMPLETED', 'PAYPAL', ${token}, ${new Date()}, ${metadata})
          `;
          
          this.logger.log(`Kết quả tạo bản ghi thanh toán: ${newPayment}`);
          this.logger.log(`Đã lưu thông tin thanh toán vào database. PaymentID: ${paymentUuid}, TransactionId: ${token}`);
        } catch (insertError) {
          this.logger.error(`Lỗi khi tạo bản ghi thanh toán mới: ${insertError.message}`, insertError.stack);
          // Thử dùng Prisma Client thay vì raw query
          try {
            this.logger.log('Thử tạo bản ghi thanh toán bằng Prisma Client...');
            const newPaymentWithClient = await this.prismaService.tbl_payment.create({
              data: {
                paymentId: paymentUuid,
                userId: userId || undefined,
                amount: orderRecord.totalAmount ? parseFloat(orderRecord.totalAmount.toString()) : null,
                status: 'COMPLETED',
                paymentMethod: 'PAYPAL',
                transactionId: token,
                createdAt: new Date()
                // Không thể sử dụng metadata thông qua Prisma Client vì chưa cập nhật schema
              }
            });
            
            // Cập nhật metadata thông qua raw query
            await this.prismaService.$executeRaw`
              UPDATE tbl_payment 
              SET "metadata" = ${metadata}
              WHERE "paymentId" = ${paymentUuid}
            `;
            
            this.logger.log(`Đã tạo bản ghi thanh toán thành công với Prisma Client. ID: ${newPaymentWithClient.paymentId}`);
          } catch (prismaError) {
            this.logger.error(`Lỗi khi tạo bản ghi thanh toán bằng Prisma Client: ${prismaError.message}`, prismaError.stack);
          }
        }
      }
      
      // Lưu chi tiết các khóa học đã mua
      for (const item of orderRecord.items) {
        try {
          // Sử dụng CourseEnrollmentService để đăng ký khóa học
          const enrollment = await this.courseEnrollmentService.enrollUserToCourse({
            userId: userId,
            courseId: item.courseId,
            paymentId: paymentUuid
          });
          
          this.logger.log(`Đã đăng ký khóa học ${item.courseId} cho người dùng ${userId}`);
          
          // Lưu chi tiết đơn hàng
          try {
            const orderDetailId = uuidv4();
            await this.prismaService.tbl_order_details.create({
              data: {
                orderDetailId: orderDetailId,
                paymentId: paymentUuid,
                courseId: item.courseId,
                price: item.price ? parseFloat(item.price.toString()) : 0,
                discount: 0, // Có thể cập nhật nếu có giảm giá
                finalPrice: item.price ? parseFloat(item.price.toString()) : 0, // Giá sau khi giảm giá
                createdAt: new Date()
              }
            });
            this.logger.log(`Đã lưu chi tiết đơn hàng cho khóa học ${item.courseId}`);
          } catch (orderDetailError) {
            this.logger.error(`Lỗi khi lưu chi tiết đơn hàng: ${orderDetailError.message}`, orderDetailError.stack);
          }
        } catch (error) {
          this.logger.error(`Lỗi khi đăng ký khóa học cho người dùng: ${error.message}`, error.stack);
        }
      }
      
      // Xóa các khóa học đã thanh toán khỏi giỏ hàng
      await this.handleSuccessfulPayment(userId, orderRecord.items);
      
      // Xóa bản ghi tạm nếu có
      try {
        await this.prismaService.$executeRaw`
          DELETE FROM tbl_payment_temp WHERE "paymentId" = ${token}
        `;
        
        this.logger.log('Đã xóa bản ghi tạm sau khi thanh toán thành công');
      } catch (error) {
        this.logger.error(`Lỗi khi xóa bản ghi tạm: ${error.message}`);
      }
      
    } catch (error) {
      this.logger.error(`Lỗi khi lưu thông tin thanh toán: ${error.message}`, error.stack);
    }
  }
}