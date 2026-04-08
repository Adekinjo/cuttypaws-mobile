import ApiService from "./ApiService";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

type ReviewData = Record<string, any>;
type CategoryPayload = Record<string, any>;
type SubCategoryPayload = Record<string, any>;

export default class CategoryService extends ApiService {
  static async getReviewsByProductId(productId: string) {
    const response = await this.client.get(`/reviews/product/${productId}`);
    return response.data;
  }

  static async getAllReviews() {
    const response = await this.client.get("/reviews/getAll");
    return response.data;
  }

  static async deleteReview(reviewId: string) {
    const response = await this.client.delete(`/reviews/delete/${reviewId}`);
    return response.data;
  }

  static async addReview(reviewData: ReviewData) {
    try {
      const response = await this.client.post("/reviews", reviewData);
      return response.data;
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  }

  static buildMultipartPayload(
    fieldName: string,
    body: Record<string, any>,
    imageFile: ReactNativeFile | null = null
  ) {
    const formData = new FormData();
    formData.append(fieldName, JSON.stringify(body));

    if (imageFile) {
      formData.append("image", imageFile as unknown as Blob);
    }

    return formData;
  }

  static async createCategory(
    body: CategoryPayload,
    imageFile: ReactNativeFile | null = null
  ) {
    const formData = this.buildMultipartPayload("category", body, imageFile);
    const response = await this.client.post("/category/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  static async updateCategory(
    categoryId: string,
    body: CategoryPayload,
    imageFile: ReactNativeFile | null = null
  ) {
    const formData = this.buildMultipartPayload("category", body, imageFile);
    const response = await this.client.put(
      `/category/update/${categoryId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  static async getAllCategories() {
    const response = await this.client.get("/category/get-all");
    return response.data;
  }

  static async getCategoryById(categoryId: string) {
    const response = await this.client.get(
      `/category/get-category-by-id/${categoryId}`
    );
    return response.data;
  }

  static async deleteCategory(categoryId: string) {
    const response = await this.client.delete(`/category/delete/${categoryId}`);
    return response.data;
  }

  static async getCategoryWithSubCategories(categoryId: string) {
    const response = await this.client.get(
      `/category/get-with-subcategories/${categoryId}`
    );
    return response.data;
  }

  static async searchCategories(query: string) {
    const response = await this.client.get("/category/search", {
      params: { query },
    });
    return response.data;
  }

  static async createSubCategory(
    body: SubCategoryPayload,
    imageFile: ReactNativeFile | null = null
  ) {
    const formData = this.buildMultipartPayload(
      "subCategory",
      body,
      imageFile
    );
    const response = await this.client.post("/sub-category/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  static async updateSubCategory(
    subCategoryId: string,
    body: SubCategoryPayload,
    imageFile: ReactNativeFile | null = null
  ) {
    const formData = this.buildMultipartPayload(
      "subCategory",
      body,
      imageFile
    );
    const response = await this.client.put(
      `/sub-category/update/${subCategoryId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  static async getAllSubCategories() {
    try {
      const response = await this.client.get("/sub-category/get-all-sub-categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching all subcategories:", error);
      throw error;
    }
  }

  static async getSubCategoriesByCategory(categoryId: string) {
    const response = await this.client.get(
      `/sub-category/get-by-category/${categoryId}`
    );
    return response.data;
  }

  static async deleteSubCategory(subCategoryId: string) {
    const response = await this.client.delete(
      `/sub-category/delete/${subCategoryId}`
    );
    return response.data;
  }

  static async getSubCategoryById(subCategoryId: string) {
    const response = await this.client.get(`/sub-category/get/${subCategoryId}`);
    return response.data;
  }

  static async searchSubCategories(query: string) {
    const response = await this.client.get("/sub-category/search", {
      params: { query },
    });
    return response.data;
  }
}
