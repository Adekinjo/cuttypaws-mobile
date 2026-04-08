import ApiService from "./ApiService";

export type PaymentPurpose = "ORDER" | "SERVICE_BOOKING" | "SERVICE_AD";

type PaymentSheetRequestPayload = {
  amount: number;
  currency: string;
  email: string;
  userId: string;
  paymentPurpose: PaymentPurpose;
  platform: "MOBILE";
  serviceBookingId?: string | number;
  serviceAdSubscriptionId?: string | number;
};

export type PaymentSheetInitResponse = {
  status: number;
  message?: string;
  paymentId?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  userId?: string | number;
  paymentPurpose?: PaymentPurpose;
  paymentStatus?: string;
  paymentIntentId?: string;
  paymentIntentClientSecret?: string;
  customerId?: string;
  customerEphemeralKeySecret?: string;
  publishableKey?: string;
};

type CartItem = {
  id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

export default class PaymentService extends ApiService {
  private static async initializePaymentSheet(
    payload: PaymentSheetRequestPayload
  ): Promise<PaymentSheetInitResponse> {
    try {
      const response = await this.client.post(
        "/payment/payment-sheet/initialize",
        payload
      );

      if (response.data.status !== 200) {
        throw new Error(response.data.message || "Payment initialization failed");
      }

      if (!response.data.paymentIntentClientSecret) {
        throw new Error("No paymentIntentClientSecret returned from server");
      }

      if (!response.data.publishableKey) {
        throw new Error("No Stripe publishable key returned from server");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Payment initialization failed"
      );
    }
  }

  static async initializeOrderPayment(
    amount: number,
    currency: string,
    email: string,
    userId: string
  ) {
    return this.initializePaymentSheet({
      amount,
      currency,
      email,
      userId,
      paymentPurpose: "ORDER",
      platform: "MOBILE",
    });
  }

  static async initializeBookingPayment(
    amount: number,
    currency: string,
    email: string,
    userId: string,
    serviceBookingId: string | number
  ) {
    return this.initializePaymentSheet({
      amount,
      currency,
      email,
      userId,
      paymentPurpose: "SERVICE_BOOKING",
      serviceBookingId,
      platform: "MOBILE",
    });
  }

  static async initializeAdPayment(
    amount: number,
    currency: string,
    email: string,
    userId: string,
    serviceAdSubscriptionId: string | number
  ) {
    return this.initializePaymentSheet({
      amount,
      currency,
      email,
      userId,
      paymentPurpose: "SERVICE_AD",
      serviceAdSubscriptionId,
      platform: "MOBILE",
    });
  }

  static async getPaymentStatus(reference: string): Promise<PaymentSheetInitResponse> {
    try {
      const response = await this.client.get("/payment/status", {
        params: { reference },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to get payment status"
      );
    }
  }

  static async waitForPaidStatus(
    reference: string,
    maxAttempts = 12,
    delayMs = 1500
  ): Promise<PaymentSheetInitResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const statusResponse = await this.getPaymentStatus(reference);

      if (statusResponse?.paymentStatus === "PAID") {
        return statusResponse;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }

    throw new Error(
      "Payment confirmation is still pending. Please wait a few seconds and try again."
    );
  }

  static async createOrderAfterPayment(
    paymentId: string,
    cartItems: CartItem[],
    totalPrice: number
  ) {
    try {
      const orderPayload = {
        paymentId,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null,
        })),
        totalPrice,
      };

      const response = await this.client.post("/payment/create-order", orderPayload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Order creation failed");
    }
  }
}
