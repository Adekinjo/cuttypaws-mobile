import ApiService from "./ApiService";

export default class ReviewService extends ApiService {
  static async getReviewsByProductId(productId: string) {
    const response = await this.client.get(`/reviews/product/${productId}`);
    return response.data;
  }

  static async getAllReviews() {
    const response = await this.client.get("/reviews/getAll");
    return response.data;
  }

  static async deleteReview(reviewId: string) {
    const response = await this.client.delete(`/reviews/delete/${reviewId}`);
    return response.data;
  }

  static async addReview(reviewData: Record<string, any>) {
    const response = await this.client.post("/reviews", reviewData);
    return response.data;
  }
}
