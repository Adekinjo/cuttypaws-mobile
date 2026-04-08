import {
  initPaymentSheet,
  initStripe,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import type { PaymentSheetInitResponse } from "../api/PaymentService";

const STRIPE_URL_SCHEME = "cuttypawsmobile";
const STRIPE_RETURN_URL = `${STRIPE_URL_SCHEME}://stripe-redirect`;
const PAYMENT_SHEET_CANCELED = "Canceled";

export async function presentMobilePaymentSheet(
  payment: PaymentSheetInitResponse
) {
  if (!payment.publishableKey) {
    throw new Error("Stripe publishable key is missing.");
  }

  if (!payment.paymentIntentClientSecret) {
    throw new Error("Payment intent client secret is missing.");
  }

  await initStripe({
    publishableKey: payment.publishableKey,
    urlScheme: STRIPE_URL_SCHEME,
  });

  const setupIntent = await initPaymentSheet({
    merchantDisplayName: "CuttyPaws",
    paymentIntentClientSecret: payment.paymentIntentClientSecret,
    customerId: payment.customerId || undefined,
    customerEphemeralKeySecret:
      payment.customerEphemeralKeySecret || undefined,
    returnURL: STRIPE_RETURN_URL,
    allowsDelayedPaymentMethods: false,
  });

  if (setupIntent.error) {
    throw new Error(
      setupIntent.error.message || "Unable to initialize payment sheet."
    );
  }

  const paymentResult = await presentPaymentSheet();

  if (paymentResult.error) {
    if (paymentResult.error.code === PAYMENT_SHEET_CANCELED) {
      throw new Error("Payment was cancelled.");
    }

    throw new Error(paymentResult.error.message || "Payment failed.");
  }

  return paymentResult;
}
