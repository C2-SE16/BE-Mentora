# Hướng dẫn cấu hình thanh toán PayPal

## Các biến môi trường cần thiết

Thêm các biến môi trường sau vào file `.env` của bạn:

```
# PayPal Configuration
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YOUR_PAYPAL_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_SANDBOX_CLIENT_SECRET
PAYPAL_ADMIN_EMAIL=YOUR_PAYPAL_SANDBOX_ADMIN_EMAIL

# Frontend URL
APP_URL=http://localhost:3000
```

## Tạo tài khoản PayPal Sandbox

1. Đăng ký tài khoản nhà phát triển PayPal tại [PayPal Developer](https://developer.paypal.com/)
2. Tạo một ứng dụng Sandbox trong tài khoản nhà phát triển của bạn
3. Lấy Client ID và Client Secret từ ứng dụng Sandbox
4. Tạo tài khoản Business Sandbox để nhận tiền thanh toán
5. Sử dụng email của tài khoản Business Sandbox làm `PAYPAL_ADMIN_EMAIL`

## Luồng thanh toán

1. Khách hàng thêm khóa học vào giỏ hàng (lưu trong Redis)
2. Khách hàng nhấn nút thanh toán
3. Backend khởi tạo thanh toán PayPal và trả về URL để chuyển hướng đến PayPal
4. Người dùng hoàn tất thanh toán trên PayPal
5. PayPal chuyển hướng người dùng trở lại website với token thanh toán
6. Backend xác nhận thanh toán với PayPal
7. Khi thanh toán được xác nhận, backend lưu đơn hàng vào database và cấp quyền truy cập khóa học cho người dùng

## Sử dụng API

### Khởi tạo thanh toán

```
POST /customer-payment/init
Headers: 
  Authorization: Bearer {token}
Body:
  {
    "returnUrl": "http://localhost:3000/payment/success",
    "cancelUrl": "http://localhost:3000/payment/cancel"
  }
```

### Xác nhận thanh toán

```
POST /customer-payment/confirm
Headers: 
  Authorization: Bearer {token}
Body:
  {
    "paymentId": "PAY-XXXX"
  }
```

## Testing

Để thử nghiệm thanh toán:
1. Đăng nhập vào tài khoản PayPal Sandbox với một tài khoản Personal test
2. Sử dụng tài khoản này để thanh toán khi chuyển hướng đến PayPal
3. Sandbox sẽ giả lập thanh toán mà không cần tiền thật
4. Tiền ảo sẽ được chuyển từ tài khoản Personal sang tài khoản Business (Admin) 