import ApiService from "./ApiService";

type ServiceError = Error & {
  status?: number;
  code?: string;
  data?: any;
};

export default class ProductService extends ApiService {
  static async addProduct(formData: FormData) {
    const response = await this.client.post("/product/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  static async searchProductBySubCategory(subCategoryId: string) {
    try {
      const response = await this.client.get("/product/search-by-subcategory", {
        params: { subCategoryId },
      });
      return response.data;
    } catch (error: any) {
      if (error?.response) {
        throw new Error(
          `Server error: ${error.response.data.message || error.response.statusText}`
        );
      }
      if (error?.request) {
        throw new Error(
          "No response received from the server. Please check your network connection."
        );
      }
      throw new Error(`Request error: ${error?.message}`);
    }
  }

  static async updateProduct(productId: string, formData: FormData) {
    const response = await this.client.put(`/product/update/${productId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  static async getAllProduct(page = 0, size = 12) {
    const response = await this.client.get("/product/get-all", {
      params: { page, size },
    });
    return response.data;
  }

  static async getAllProductsBySubCategory(subCategoryId: string) {
    const response = await this.client.get(`/product/subcategory/${subCategoryId}`);
    return response.data;
  }

  static async searchProduct(searchValue: string) {
    const response = await this.client.get("/search/products", {
      params: { query: searchValue },
    });
    return response.data;
  }

  static async getSearchSuggestions(query: string) {
    try {
      const response = await this.client.get("/product/suggestions", {
        params: { query },
      });
      return response.data.suggestions;
    } catch {
      return [];
    }
  }

  static async searchProductsWithPrice(
    name?: string | null,
    categoryId?: string | null,
    minPrice?: number | null,
    maxPrice?: number | null
  ) {
    const response = await this.client.get("/product/search-with-price", {
      params: {
        name: name || null,
        categoryId: categoryId || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
      },
    });
    return response.data;
  }

  static async getRelatedProducts(searchTerm: string) {
    const response = await this.client.get(`/search/related-products/${searchTerm}`);
    return response.data;
  }

  static async getProductsByNameAndCategory(name: string, categoryId: string) {
    const response = await this.client.get("/product/filter-by-name-and-category", {
      params: { name, categoryId },
    });
    return response.data;
  }

  static async getAllProductByCategoryId(categoryId: string) {
    const response = await this.client.get(`/product/get-by-category-id/${categoryId}`);
    return response.data;
  }

  static async getProductById(productId: string) {
    const response = await this.client.get(`/product/get-product-by/${productId}`);
    return response.data;
  }

  static async getProductDetails(productId: string) {
    const response = await this.client.get(`/product/details/${productId}`);
    return response.data;
  }

  static async deleteProduct(productId: string) {
    const response = await this.client.delete(`/product/delete/${productId}`);
    return response.data;
  }

  static async getTrendingProducts() {
    try {
      const response = await this.client.get("/product/trending");
      return response.data.trendingProducts || [];
    } catch {
      return [];
    }
  }

  static async getFeaturedProducts() {
    try {
      const response = await this.client.get("/product/featured");
      return { featuredProducts: response.data?.featuredProducts || [] };
    } catch {
      return { featuredProducts: [] };
    }
  }

  static async trackProductView(productId: string) {
    try {
      await this.client.post(`/product/${productId}/view`, {});
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  }

  static async likeProduct(productId: string) {
    try {
      const response = await this.client.post(`/product/${productId}/like`, {});
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to like the product. Please try again.");
    }
  }

  static async getAllLikes() {
    try {
      const response = await this.client.get("/product/all-with-likes");
      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch likes. Please try again.");
    }
  }

  static handleError(error: any, fallbackMessage: string): ServiceError {
    const customError = new Error(
      error?.response?.data?.message || fallbackMessage
    ) as ServiceError;
    customError.status = error?.response?.status || 500;
    customError.data = error?.response?.data;
    return customError;
  }
}
