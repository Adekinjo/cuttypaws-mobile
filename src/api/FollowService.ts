import ApiService from "./ApiService";
import AuthService from "./AuthService";

export default class FollowService extends ApiService {
  static async followUser(userId: string) {
    try {
      const response = await this.client.post(`/follow/${userId}`, {});
      return response.data;
    } catch (error: any) {
      return {
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to follow user",
        success: false,
      };
    }
  }

  static async unfollowUser(userId: string) {
    try {
      const response = await this.client.delete(`/follow/${userId}`);
      return response.data;
    } catch (error: any) {
      return {
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to unfollow user",
        success: false,
      };
    }
  }

  static async getFollowStats(userId: string) {
    try {
      const response = await this.client.get(`/follow/${userId}/stats`);
      return response.data;
    } catch {
      return {
        status: 200,
        success: true,
        followStats: {
          userId,
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
          isFollowedBy: false,
        },
      };
    }
  }

  static async getFollowers(userId: string, page = 0, size = 20) {
    try {
      const response = await this.client.get(`/follow/${userId}/followers`, {
        params: { page, size },
      });

      if (response.data?.followersList) {
        return {
          ...response.data,
          followersList: response.data.followersList.map((follow: any) => {
            const user = follow.follower || follow.user || follow;
            return {
              ...user,
              followId: follow.id,
              createdAt: follow.createdAt,
              isMuted: follow.isMuted,
            };
          }),
        };
      }

      return response.data;
    } catch {
      return {
        status: 200,
        success: true,
        followersList: [],
      };
    }
  }

  static async getFollowing(userId: string, page = 0, size = 20) {
    try {
      const response = await this.client.get(`/follow/${userId}/following`, {
        params: { page, size },
      });

      if (response.data?.followingList) {
        return {
          ...response.data,
          followingList: response.data.followingList.map((follow: any) => {
            const user = follow.following || follow.user || follow;
            return {
              ...user,
              followId: follow.id,
              createdAt: follow.createdAt,
              isMuted: follow.isMuted,
            };
          }),
        };
      }

      return response.data;
    } catch {
      return {
        status: 200,
        success: true,
        followingList: [],
      };
    }
  }

  static async checkFollowStatus(targetUserId: string) {
    try {
      const response = await this.client.get(`/follow/${targetUserId}/status`);
      return response.data;
    } catch {
      return {
        status: 200,
        success: true,
        followStats: {
          isFollowing: false,
          isFollowedBy: false,
        },
      };
    }
  }

  static async muteUser(userId: string) {
    try {
      const response = await this.client.post(`/follow/${userId}/mute`, {});
      return response.data;
    } catch (error: any) {
      return {
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to mute user",
        success: false,
      };
    }
  }

  static async unmuteUser(userId: string) {
    try {
      const response = await this.client.post(`/follow/${userId}/unmute`, {});
      return response.data;
    } catch (error: any) {
      return {
        status: error?.response?.status || 500,
        message: error?.response?.data?.message || "Failed to unmute user",
        success: false,
      };
    }
  }

  static async getMutualFollowers(userId: string) {
    try {
      const response = await this.client.get(`/follow/${userId}/mutual`);

      if (response.data?.followingList) {
        return {
          ...response.data,
          followingList: response.data.followingList.map((follow: any) => ({
            ...follow.following,
            followId: follow.id,
            createdAt: follow.createdAt,
          })),
        };
      }

      return response.data;
    } catch {
      return {
        status: 200,
        success: true,
        followingList: [],
      };
    }
  }

  static async canFollow(targetUserId: string) {
    try {
      const currentUser = await AuthService.getStoredUser();
      if (!currentUser?.id) {
        return { canFollow: false, reason: "Not authenticated" };
      }

      if (currentUser.id === targetUserId) {
        return { canFollow: false, reason: "Cannot follow yourself" };
      }

      const status = await this.checkFollowStatus(targetUserId);
      return {
        canFollow: !status.followStats?.isFollowing,
        isFollowing: status.followStats?.isFollowing,
      };
    } catch {
      return { canFollow: true };
    }
  }
}
