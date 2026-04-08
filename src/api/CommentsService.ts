import ApiService from "./ApiService";

type ServiceError = Error & {
  status?: number;
  code?: string;
  data?: any;
};

export default class CommentsService extends ApiService {
  static async createComment(data: Record<string, any>) {
    try {
      const response = await this.client.post("/comments/create", data);
      return response.data;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw this.handleError(error);
    }
  }

  static async updateComment(commentId: string, data: Record<string, any>) {
    try {
      const response = await this.client.put(`/comments/${commentId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating comment:", error);
      throw this.handleError(error);
    }
  }

  static async deleteComment(commentId: string) {
    try {
      const response = await this.client.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw this.handleError(error);
    }
  }

  static async getCommentsByPostId(postId: string, page = 0, size = 20) {
    try {
      const response = await this.client.get(`/comments/post/${postId}`, {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw this.handleError(error);
    }
  }

  static async getCommentById(commentId: string) {
    try {
      const response = await this.client.get(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching comment:", error);
      throw this.handleError(error);
    }
  }

  static async likeComment(commentId: string) {
    try {
      const response = await this.client.post(`/comments/${commentId}/like`, {});
      return response.data;
    } catch (error) {
      console.error("Error liking comment:", error);
      throw this.handleError(error);
    }
  }

  static async unlikeComment(commentId: string) {
    try {
      const response = await this.client.post(`/comments/${commentId}/unlike`, {});
      return response.data;
    } catch (error) {
      console.error("Error unliking comment:", error);
      throw this.handleError(error);
    }
  }

  static async reactToComment(commentId: string, emoji: string) {
    try {
      const response = await this.client.post(`/comments/${commentId}/react`, {}, {
        params: { emoji },
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error reacting to comment:", error);

      if (error?.response?.status === 400) {
        const customError = new Error("Invalid emoji format") as ServiceError;
        customError.status = 400;
        customError.code = "INVALID_EMOJI";
        throw customError;
      }

      if (error?.response?.status === 409) {
        const customError = new Error("Reaction already exists") as ServiceError;
        customError.status = 409;
        customError.code = "DUPLICATE_REACTION";
        throw customError;
      }

      throw this.handleError(error);
    }
  }

  static async removeReaction(commentId: string, emoji: string) {
    try {
      const response = await this.client.delete(`/comments/${commentId}/react`, {
        params: { emoji },
      });
      return response.data;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw this.handleError(error);
    }
  }

  static async getUserReaction(commentId: string) {
    try {
      const response = await this.client.get(`/comments/${commentId}/user-reaction`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user reaction:", error);
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
