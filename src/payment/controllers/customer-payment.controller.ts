import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Param, 
  Req, 
  Res, 
  Logger, 
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { CustomerPaymentService } from '../services/customer-payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InitiateCustomerPaymentDto, CaptureCustomerPaymentDto, PaypalWebhookDto } from '../dto/customer-payment.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CartService } from '../../common/services/cart.service';

@ApiTags('Customer Payment')
@Controller('customer-payment')
export class CustomerPaymentController {
  private readonly logger = new Logger(CustomerPaymentController.name);
  private frontendBaseUrl: string;

  constructor(
    private readonly customerPaymentService: CustomerPaymentService,
    private readonly configService: ConfigService,
    private readonly cartService: CartService,
  ) {
    this.frontendBaseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
  }

  @Post('init')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khởi tạo thanh toán bằng PayPal' })
  async initiatePayment(@Body() initiateDto: InitiateCustomerPaymentDto, @Req() req) {
    this.logger.log('Bắt đầu khởi tạo thanh toán mới');
    
    try {
      // Lấy userId từ token JWT
      const userId = req.user?.userId || req.user?.sub;
      this.logger.log(`UserId từ JWT token: ${userId}`);
      
      if (!userId) {
        this.logger.error('Không thể xác thực người dùng từ token');
        throw new UnauthorizedException('Không thể xác thực người dùng từ token');
      }
      
      // Override userId trong DTO
      initiateDto.userId = userId;
      
      // Xử lý các khóa học được chọn nếu có
      if (initiateDto.selectedCourseIds && initiateDto.selectedCourseIds.length > 0) {
        this.logger.log(`Khách hàng chọn ${initiateDto.selectedCourseIds.length} khóa học để thanh toán`);
        // Cập nhật danh sách khóa học được chọn trong giỏ hàng
        try {
          await this.cartService.selectCartItems({
            userId: userId,
            selectedCourseIds: initiateDto.selectedCourseIds
          });
          this.logger.log('Đã cập nhật danh sách khóa học được chọn thành công');
        } catch (error) {
          this.logger.error(`Lỗi khi cập nhật khóa học được chọn: ${error.message}`);
          throw new BadRequestException(`Không thể chọn khóa học: ${error.message}`);
        }
      }
      
      this.logger.log(`Thông tin khởi tạo thanh toán: ${JSON.stringify(initiateDto)}`);
      
      const result = await this.customerPaymentService.initiatePayment(initiateDto);
      this.logger.log(`Kết quả khởi tạo thanh toán: ${JSON.stringify(result)}`);
      
      if (!result.success) {
        // Nếu có lỗi, trả về mã lỗi 400 Bad Request
        throw new BadRequestException(result.error || 'Khởi tạo thanh toán thất bại');
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Lỗi khi khởi tạo thanh toán: ${error.message}`, error.stack);
      
      // Xử lý các loại lỗi khác nhau
      if (error instanceof UnauthorizedException) {
        throw error; // Giữ nguyên lỗi 401
      } else if (error instanceof BadRequestException) {
        throw error; // Giữ nguyên lỗi 400
      } else {
        // Các lỗi khác trả về dưới dạng BadRequestException
        throw new BadRequestException(error.message || 'Lỗi khi khởi tạo thanh toán');
      }
    }
  }

  @Get('capture')
  @ApiOperation({ summary: 'Xác nhận thanh toán sau khi được chấp nhận từ PayPal' })
  async capturePayment(@Req() req, @Res() res: Response) {
    try {
      this.logger.log('Bắt đầu xử lý xác nhận thanh toán từ PayPal');
      const token = req.query.token as string;
      const userId = req.query.userId as string;
      
      this.logger.log(`Thông tin xác nhận thanh toán - Token: ${token}, UserId: ${userId}`);
      
      if (!token) {
        this.logger.error('Thiếu token thanh toán trong yêu cầu');
        return res.status(400).json({
          success: false,
          error: 'missing_token',
          message: 'Thiếu token thanh toán trong yêu cầu'
        });
      }
      
      const captureResult = await this.customerPaymentService.capturePayment({
        token,
        userId
      });
      
      this.logger.log(`Kết quả xác nhận thanh toán: ${JSON.stringify(captureResult)}`);
      
      // Trả về kết quả JSON với mã trạng thái phù hợp
      const statusCode = captureResult.success ? 200 : 400;
      
      return res.status(statusCode).json({
        ...captureResult,
        // Thêm thông tin thành công cho phía frontend
        message: captureResult.success 
          ? 'Thanh toán thành công'
          : captureResult.error || 'Lỗi khi xác nhận thanh toán'
      });
    } catch (error) {
      this.logger.error(`Lỗi xác nhận thanh toán: ${error.message}`, error.stack);
      
      return res.status(500).json({
        success: false,
        error: 'payment_error',
        message: error.message || 'Lỗi không xác định khi xử lý thanh toán'
      });
    }
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xác nhận thanh toán từ phía client' })
  async confirmPayment(@Body() captureDto: CaptureCustomerPaymentDto, @Req() req) {
    this.logger.log('Bắt đầu xác nhận thanh toán từ client');
    
    // Lấy userId từ token JWT
    const userId = req.user.userId || req.user.sub;
    this.logger.log(`UserId từ JWT token: ${userId}`);
    
    // Override userId trong DTO
    captureDto.userId = userId;
    this.logger.log(`Thông tin xác nhận thanh toán: ${JSON.stringify(captureDto)}`);
    
    const result = await this.customerPaymentService.capturePayment(captureDto);
    this.logger.log(`Kết quả xác nhận thanh toán: ${JSON.stringify(result)}`);
    
    return result;
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook cho PayPal để nhận thông báo' })
  async handleWebhook(@Body() webhookData: PaypalWebhookDto) {
    this.logger.log(`Nhận webhook từ PayPal: ${webhookData.event_type}`);
    this.logger.log(`Dữ liệu webhook: ${JSON.stringify(webhookData)}`);
    
    // Xử lý các sự kiện từ PayPal
    // Trong một ứng dụng thực tế, bạn cần xác thực webhook từ PayPal
    
    return { received: true };
  }

  @Get('capture-api')
  @ApiOperation({ summary: 'Xác nhận thanh toán và trả về JSON thay vì chuyển hướng' })
  async capturePaymentApi(@Req() req) {
    try {
      this.logger.log('Bắt đầu xử lý xác nhận thanh toán từ PayPal (API)');
      const token = req.query.token as string;
      const userId = req.query.userId as string;
      
      this.logger.log(`Thông tin xác nhận thanh toán - Token: ${token}, UserId: ${userId}`);
      
      if (!token) {
        this.logger.error('Thiếu token thanh toán trong yêu cầu');
        throw new BadRequestException('Thiếu token thanh toán trong yêu cầu');
      }
      
      const captureResult = await this.customerPaymentService.capturePayment({
        token,
        userId
      });
      
      this.logger.log(`Kết quả xác nhận thanh toán: ${JSON.stringify(captureResult)}`);
      
      if (!captureResult.success) {
        return {
          success: false,
          error: captureResult.error || 'Lỗi không xác định khi xác nhận thanh toán',
          details: captureResult.details || null
        };
      }
      
      return captureResult;
    } catch (error) {
      this.logger.error(`Lỗi xác nhận thanh toán: ${error.message}`, error.stack);
      
      return {
        success: false,
        error: error.message || 'Lỗi không xác định',
        details: null
      };
    }
  }
} 