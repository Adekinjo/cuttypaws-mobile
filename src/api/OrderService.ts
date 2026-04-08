import ApiService from "./ApiService";

type CartItem = {
  id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

export default class OrderService extends ApiService {
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

  static async getAllOrders() {
    const response = await this.client.get("/order/filter");
    return response.data;
  }

  static async getOrderItemById(itemId: string) {
    const response = await this.client.get("/order/filter", {
      params: { itemId },
    });
    return response.data;
  }

  static async getAllOrderItemsByStatus(status: string) {
    const response = await this.client.get("/order/filter", {
      params: { status },
    });
    return response.data;
  }

  static async getMyOrderHistory(page = 0, size = 6) {
    const response = await this.client.get("/order/my-orders", {
      params: { page, size },
    });
    return response.data;
  }

  static async updateOrderitemStatus(orderItemId: string, status: string) {
    const response = await this.client.put(
      `/order/update-item-status/${orderItemId}`,
      {},
      {
        params: { status },
      }
    );
    return response.data;
  }

  static async saveAddress(body: Record<string, any>) {
    const response = await this.client.post("/address/save", body);
    return response.data;
  }
}
