import ApiService from "./ApiService";

export default class WishlistService extends ApiService {
  static async addToWishlist(productId: string) {
    const userId = await this.getUserId();
    const response = await this.client.post("/wishlist/add", { userId, productId });
    return response.data;
  }

  static async getWishlist() {
    const authenticated = await ApiService.isAuthenticated();
    if (!authenticated) {
      return [];
    }

    const userId = await this.getUserId();
    try {
      const response = await this.client.get(`/wishlist/user/${userId}`);
      return response.data;
    } catch {
      return [];
    }
  }

  static async removeFromWishlist(productId: string) {
    const userId = await this.getUserId();
    const response = await this.client.delete("/wishlist/remove", {
      params: { userId, productId },
    });
    return response.data;
  }
}
