import ApiService from "../api/ApiService";
import { storage } from "../utils/storage";

export async function handle401(error: any, onUnauthorized?: () => void) {
  if (error?.response?.status === 401) {
    await storage.clearAuth();
    if (onUnauthorized) onUnauthorized();
    return true;
  }
  return false;
}

export default class UserProfileService extends ApiService {
  static async getUserProfile(userId: string) {
    const response = await this.client.get(`/users/${userId}/profile`);
    return response.data;
  }

  static async getUserPosts(userId: string) {
    const response = await this.client.get(`/users/${userId}/posts`);
    return response.data;
  }

  static async getUserStats(userId: string) {
    const response = await this.client.get(`/users/${userId}/stats`);
    return response.data;
  }

  static async blockUser(userId: string, reason: string) {
    const response = await this.client.post(`/users/${userId}/block`, null, {
      params: { reason },
    });
    return response.data;
  }

  static async unblockUser(userId: string) {
    const response = await this.client.post(`/users/${userId}/unblock`);
    return response.data;
  }

  static async getFollowers(userId: string, page = 0, size = 20) {
    const response = await this.client.get(`/follow/${userId}/followers`, {
      params: { page, size },
    });
    return response.data;
  }

  static async getFollowing(userId: string, page = 0, size = 20) {
    const response = await this.client.get(`/follow/${userId}/following`, {
      params: { page, size },
    });
    return response.data;
  }

  static async getFollowStats(userId: string) {
    const response = await this.client.get(`/follow/${userId}/stats`);
    return response.data;
  }

  static async getUserFollowData(userId: string) {
    const [followersResponse, followingResponse, statsResponse] =
      await Promise.all([
        this.getFollowers(userId),
        this.getFollowing(userId),
        this.getFollowStats(userId),
      ]);

    return {
      followers: followersResponse?.followersList || [],
      following: followingResponse?.followingList || [],
      stats: statsResponse?.followStats || {},
    };
  }
}