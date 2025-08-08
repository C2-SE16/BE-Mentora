export const convertDecimalValues = (vouchers: any | any[]) => {
  if (!vouchers) return vouchers;

  // Nếu là mảng
  if (Array.isArray(vouchers)) {
    return vouchers.map((voucher) => {
      const convertedVoucher = { ...voucher };

      // Chuyển đổi discountValue nếu tồn tại và là Decimal
      if (voucher.discountValue && voucher.discountValue.d) {
        convertedVoucher.discountValue = Number(voucher.discountValue);
      }

      // Chuyển đổi maxDiscount nếu tồn tại và là Decimal
      if (voucher.maxDiscount && voucher.maxDiscount.d) {
        convertedVoucher.maxDiscount = Number(voucher.maxDiscount);
      }

      return convertedVoucher;
    });
  }

  // Nếu là một đối tượng đơn lẻ
  const voucher = vouchers;
  const convertedVoucher = { ...voucher };

  if (voucher.discountValue && voucher.discountValue.d) {
    convertedVoucher.discountValue = Number(voucher.discountValue);
  }

  if (voucher.maxDiscount && voucher.maxDiscount.d) {
    convertedVoucher.maxDiscount = Number(voucher.maxDiscount);
  }

  return convertedVoucher;
};
