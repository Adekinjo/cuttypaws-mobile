import type { PaymentSheetInitResponse } from "../api/PaymentService";

export async function presentMobilePaymentSheet(
  _payment: PaymentSheetInitResponse
) {
  throw new Error("Stripe mobile payment sheet is only available in the native app.");
}
