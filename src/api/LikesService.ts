import ApiService from "./ApiService";

type ServiceError = Error & {
  status?: number;
  code?: string;
  data?: any;
};

export default class LikesService extends ApiService {
  static ReactionType = {
    PAWPRINT: "PAWPRINT",
    COOKIE: "COOKIE",
    BONE: "BONE",
    HEART: "HEART",
  } as const;

  static async reactToPost(
    postId: string,
    reactionType: (typeof this.ReactionType)[keyof typeof this.ReactionType]
  ) {
    try {
      const response = await this.client.post(`/likes/${postId}/react`, {}, {
        params: { reaction: reactionType },
      });
      return response.data;
    } catch (error) {
      console.error("Error reacting to post:", error);
      throw this.handleError(error);
    }
  }

  static async removeReaction(postId: string) {
    try {
      const response = await this.client.post(`/likes/${postId}/remove-reaction`, {});
      return response.data;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw this.handleError(error);
    }
  }

  static async getPostReactions(postId: string) {
    try {
      const response = await this.client.get(`/likes/${postId}/reactions`);
      return response.data;
    } catch (error) {
      console.error("Error fetching post reactions:", error);
      throw this.handleError(error);
    }
  }

  static async getUserReaction(postId: string) {
    try {
      const response = await this.client.get(`/likes/${postId}/user-reaction`);
      return response.data;
    } catch (error) {
      console.error("Error checking user reaction:", error);
      throw this.handleError(error);
    }
  }

  static async likePost(postId: string) {
    return this.reactToPost(postId, this.ReactionType.PAWPRINT);
  }

  static async unlikePost(postId: string) {
    return this.removeReaction(postId);
  }

  static async getPostLikes(postId: string) {
    try {
      const response = await this.client.get(`/likes/${postId}/likes`);
      return response.data;
    } catch (error) {
      console.error("Error fetching post likes:", error);
      throw this.handleError(error);
    }
  }

  static async getUserLikedPosts(userId: string) {
    try {
      const response = await this.client.get(`/likes/user/${userId}/liked-posts`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user liked posts:", error);
      throw this.handleError(error);
    }
  }

  static async checkIfUserLikedPost(postId: string) {
    try {
      const response = await this.client.get(`/likes/${postId}/liked`);
      return response.data;
    } catch (error) {
      console.error("Error checking like status:", error);
      throw this.handleError(error);
    }
  }

  static handleError(error: any): ServiceError {
    if (error?.response) {
      const backendMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "An error occurred";

      if (
        backendMessage.includes("JWT expired") ||
        backendMessage.includes("JWT signature does not match")
      ) {
        const customError = new Error(
          "Your session has expired. Please log in again."
        ) as ServiceError;
        customError.status = 401;
        customError.code = "JWT_EXPIRED";
        return customError;
      }

      if (error.response.status === 400 && backendMessage.includes("already liked")) {
        const customError = new Error("You have already liked this post") as ServiceError;
        customError.status = 400;
        customError.code = "ALREADY_LIKED";
        return customError;
      }

      if (error.response.status === 400 && backendMessage.includes("not liked")) {
        const customError = new Error("You have not liked this post") as ServiceError;
        customError.status = 400;
        customError.code = "NOT_LIKED";
        return customError;
      }

      const customError = new Error(backendMessage) as ServiceError;
      customError.status = error.response.status;
      customError.data = error.response.data;
      return customError;
    }

    if (error?.request) {
      const customError = new Error(
        "Network error. Please check your connection."
      ) as ServiceError;
      customError.status = 0;
      customError.code = "NETWORK_ERROR";
      return customError;
    }

    const customError = new Error(
      error?.message || "An unexpected error occurred"
    ) as ServiceError;
    customError.status = 500;
    customError.code = "UNKNOWN_ERROR";
    return customError;
  }
}
