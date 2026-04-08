import ApiService from "./ApiService";

type ServiceError = Error & {
  status?: number;
  code?: string;
  data?: any;
};

export default class CommentLikeService extends ApiService {
  static ReactionType = {
    LIKE: "LIKE",
    LOVE: "LOVE",
    HAHA: "HAHA",
    WOW: "WOW",
    SAD: "SAD",
    ANGRY: "ANGRY",
  } as const;

  static async reactToComment(
    commentId: string,
    reactionType: (typeof this.ReactionType)[keyof typeof this.ReactionType]
  ) {
    try {
      const response = await this.client.post(
        `/comments/${commentId}/react`,
        {},
        {
          params: { reaction: reactionType },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error reacting to comment:", error);
      throw this.handleError(error);
    }
  }

  static async removeReaction(commentId: string) {
    try {
      const response = await this.client.post(
        `/comments/${commentId}/remove-reaction`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error("Error removing reaction from comment:", error);
      throw this.handleError(error);
    }
  }

  static async getCommentReactions(commentId: string) {
    try {
      const response = await this.client.get(`/comments/${commentId}/reactions`);
      return response.data;
    } catch (error) {
      console.error("Error fetching comment reactions:", error);
      throw this.handleError(error);
    }
  }

  static async getUserReaction(commentId: string) {
    try {
      const response = await this.client.get(
        `/comments/${commentId}/user-reaction`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking user reaction to comment:", error);
      throw this.handleError(error);
    }
  }

  static async likeComment(commentId: string) {
    return this.reactToComment(commentId, this.ReactionType.LIKE);
  }

  static async unlikeComment(commentId: string) {
    return this.removeReaction(commentId);
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
