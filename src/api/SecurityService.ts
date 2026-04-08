import ApiService from "./ApiService";

export default class SecurityService extends ApiService {
  static async getSecurityEvents() {
    const response = await this.client.get("/admin/security/events");
    return response.data;
  }

  static async resolveSecurityEvent(eventId: string) {
    await this.client.post(`/admin/security/events/${eventId}/resolve`, {});
  }

  static async blockIp(ipAddress: string) {
    await this.client.post(`/admin/security/block-ip/${ipAddress}`, {});
  }

  static async getMaliciousUsers() {
    const response = await this.client.get("/admin/security/malicious-users");
    return response.data;
  }

  static async blockAllUserIps(email: string) {
    const response = await this.client.post(`/admin/security/block-user-ips/${email}`, {});
    return response.data;
  }

  static async getEventsByIp(ipAddress: string) {
    const response = await this.client.get(`/admin/security/events/ip/${ipAddress}`);
    return response.data;
  }
}
