import ApiService from "./ApiService";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

type PostData = {
  caption?: string | null;
  media?: ReactNativeFile[];
  mediaToDelete?: string[];
};

type ServiceError = Error & {
  status?: number;
  data?: any;
};

export default class PostService extends ApiService {
  static normalizeCursorPage(data: any) {
    const postList = data?.posts || data?.postList || data?.content || [];
    const nextCursor = data?.nextCursor || null;
    const hasMore =
      typeof data?.hasMore === "boolean"
        ? data.hasMore
        : Boolean(nextCursor) && postList.length > 0;

    return { ...data, postList, nextCursor, hasMore };
  }

  static async createPost(postData: PostData) {
    try {
      const formData = new FormData();
      formData.append("caption", postData.caption || "");
      (postData.media || []).forEach((file) => {
        formData.append("media", file as unknown as Blob);
      });

      const response = await this.client.post("/post/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async updatePost(postId: string, postData: PostData) {
    try {
      const formData = new FormData();

      if (postData.caption !== undefined && postData.caption !== null) {
        formData.append("caption", postData.caption);
      }

      (postData.media || []).forEach((file) => {
        formData.append("media", file as unknown as Blob);
      });

      (postData.mediaToDelete || []).forEach((id) => {
        formData.append("mediaToDelete", id);
      });

      const response = await this.client.put(`/post/${postId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getAllPosts({
    cursorCreatedAt = null,
    cursorId = null,
    limit = 20,
  }: {
    cursorCreatedAt?: string | null;
    cursorId?: string | null;
    limit?: number;
  } = {}) {
    try {
      const params: Record<string, any> = { limit };
      if (cursorCreatedAt && cursorId) {
        params.cursorCreatedAt = cursorCreatedAt;
        params.cursorId = cursorId;
      }

      const response = await this.client.get("/post/get-all", { params });
      return this.normalizeCursorPage(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getPostById(postId: string) {
    try {
      const response = await this.client.get(`/post/${postId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getMyPosts() {
    try {
      const response = await this.client.get("/post/my-posts");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async getUserPosts(userId: string) {
    try {
      const response = await this.client.get(`/post/user/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static async deletePost(postId: string) {
    try {
      const response = await this.client.delete(`/post/${postId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static handleError(error: any): ServiceError {
    if (error?.response) {
      const e = new Error(
        error.response.data?.message ||
          error.response.data?.error ||
          "An error occurred"
      ) as ServiceError;
      e.status = error.response.status;
      e.data = error.response.data;
      return e;
    }

    if (error?.request) {
      const e = new Error("Network error. Please check your connection.") as ServiceError;
      e.status = 0;
      return e;
    }

    const e = new Error(error?.message || "An unexpected error occurred") as ServiceError;
    e.status = 500;
    return e;
  }
}
