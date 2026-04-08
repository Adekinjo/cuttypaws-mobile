import ApiService from "./ApiService";

export default class DealService extends ApiService {
  static async createDeal(dealDto: Record<string, any>) {
    const response = await this.client.post("/deals/create", dealDto);
    return response.data;
  }

  static async updateDeal(dealId: string, dealDto: Record<string, any>) {
    const response = await this.client.put(`/deals/update/${dealId}`, dealDto);
    return response.data;
  }

  static async deleteDeal(dealId: string) {
    const response = await this.client.delete(`/deals/delete/${dealId}`);
    return response.data;
  }

  static async getActiveDeals() {
    const response = await this.client.get("/deals/all/active");
    return response.data;
  }

  static async getDealByProductId(productId: string) {
    const response = await this.client.get(`/deals/product/${productId}`);
    return response.data;
  }

  static async toggleDealStatus(dealId: string, active: boolean) {
    const response = await this.client.patch(`/deals/${dealId}/status`, {}, {
      params: { active },
    });
    return response.data;
  }
}
