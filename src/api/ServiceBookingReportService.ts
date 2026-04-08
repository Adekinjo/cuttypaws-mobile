import ApiService from "./ApiService";

export default class ServiceBookingReportService extends ApiService {
  static async createReport(payload: Record<string, any>) {
    const response = await this.client.post("/service-booking-reports", payload);
    return response.data;
  }

  static async getMyReports() {
    const response = await this.client.get("/service-booking-reports/my-reports");
    return response.data;
  }

  static async getAdminReports() {
    const response = await this.client.get("/service-booking-reports/admin");
    return response.data;
  }

  static async getAdminReportById(reportId: string) {
    const response = await this.client.get(`/service-booking-reports/admin/${reportId}`);
    return response.data;
  }

  static async updateAdminReport(reportId: string, payload: Record<string, any>) {
    const response = await this.client.put(
      `/service-booking-reports/admin/${reportId}`,
      payload
    );
    return response.data;
  }
}
