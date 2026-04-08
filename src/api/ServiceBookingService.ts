import ApiService from "./ApiService";

export default class ServiceBookingService extends ApiService {
  static async createBooking(payload: Record<string, any>) {
    try {
      const response = await this.client.post("/service-bookings/my-bookings", payload);
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Booking creation failed");
    }
  }

  static async confirmBookingPayment(paymentReference: string) {
    try {
      if (!paymentReference) {
        throw new Error("Booking payment reference is missing.");
      }

      const response = await this.client.post(
        "/service-bookings/my-bookings/confirm-payment",
        { paymentReference }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Booking payment confirmation failed"
      );
    }
  }

  static async getMyBookings() {
    try {
      const response = await this.client.get("/service-bookings/my-bookings");
      return response.data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Failed to get bookings");
    }
  }

  static async getMyProviderBookings() {
    try {
      const response = await this.client.get("/service-bookings/provider/bookings");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to get provider bookings"
      );
    }
  }
}
