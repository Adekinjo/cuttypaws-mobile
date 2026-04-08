import ApiService from "./ApiService";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

type SupportMessageWithImageOptions = {
  prompt: string;
  image: ReactNativeFile;
  city?: string | null;
  state?: string | null;
};

export default class AIService extends ApiService {
  static async sendSupportMessage(
    prompt: string,
    city: string | null = null,
    state: string | null = null,
    radiusMiles: number | null = null
  ) {
    try {
      const payload = {
        prompt,
        feature: "AI_SUPPORT",
        city,
        state,
        radiusMiles,
      };

      const response = await this.client.post("/ai/support", payload);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || "Failed to get AI support response"
      );
    }
  }

  static async sendSupportMessageWithImage({
    prompt,
    image,
    city = null,
    state = null,
  }: SupportMessageWithImageOptions) {
    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("image", image as unknown as Blob);

      if (city) {
        formData.append("city", city);
      }

      if (state) {
        formData.append("state", state);
      }

      const headers = await this.getHeader();

      const response = await this.client.post("/ai/support/image", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          "Failed to get AI image support response"
      );
    }
  }
}
