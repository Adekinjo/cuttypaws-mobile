import ApiService from "./ApiService";

export default class CacheService extends ApiService {
  static async getCacheDashboard() {
    const response = await this.client.get("/admin/cache/dashboard");
    return response.data;
  }

  static async clearCache(cacheName: string) {
    const response = await this.client.post(`/admin/cache/clear/${cacheName}`, {});
    return response.data;
  }

  static async clearAllCaches() {
    const response = await this.client.post("/admin/cache/clear-all", {});
    return response.data;
  }

  static async resetCacheStats() {
    const response = await this.client.post("/admin/cache/stats/reset", {});
    return response.data;
  }

  static async getCacheHealth() {
    const response = await this.client.get("/admin/cache/health");
    return response.data;
  }

  static async generateCacheActivity() {
    const response = await this.client.post(
      "/admin/cache/generate-activity",
      {}
    );
    return response.data;
  }

  static async disableCaching() {
    const response = await this.client.post("/admin/cache/toggle/disable", {});
    return response.data;
  }

  static async enableCaching() {
    const response = await this.client.post("/admin/cache/toggle/enable", {});
    return response.data;
  }

  static async cacheToggleStatus() {
    const response = await this.client.get("/admin/cache/toggle/status");
    return response.data;
  }
}
