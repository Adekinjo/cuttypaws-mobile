import ApiService from "./ApiService";

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

type PetData = Record<string, any> & {
  images?: ReactNativeFile[];
  tags?: string[];
};

export default class PetService extends ApiService {
  static unwrapResponse(response: any, fallbackMessage?: string) {
    const data = response?.data;
    if (!data) {
      throw new Error(fallbackMessage || "Empty response from server");
    }
    if (typeof data.status === "number" && data.status !== 200) {
      throw new Error(data.message || fallbackMessage || "Request failed");
    }
    return data;
  }

  static buildFormData(petData: PetData) {
    const formData = new FormData();

    Object.keys(petData).forEach((key) => {
      const value = petData[key];
      if (value === null || value === undefined) return;

      if (key === "images" && Array.isArray(value)) {
        value.forEach((img) => formData.append("images", img as unknown as Blob));
      } else if (key === "tags" && Array.isArray(value)) {
        value.forEach((tag) => formData.append("tags", tag));
      } else {
        formData.append(key, String(value));
      }
    });

    return formData;
  }

  static async createPet(petData: PetData) {
    const response = await this.client.post("/pet/create", this.buildFormData(petData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return this.unwrapResponse(response, "Failed to create pet");
  }

  static async updatePet(petId: string, petData: PetData) {
    const response = await this.client.put(`/pet/${petId}`, this.buildFormData(petData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return this.unwrapResponse(response, "Failed to update pet");
  }

  static async deletePet(petId: string) {
    const response = await this.client.delete(`/pet/${petId}`);
    return this.unwrapResponse(response, "Failed to delete pet");
  }

  static async getPet(petId: string) {
    const response = await this.client.get(`/pet/${petId}`);
    return this.unwrapResponse(response, "Failed to fetch pet");
  }

  static async getMyPets() {
    const response = await this.client.get("/pet/my-pets");
    return this.unwrapResponse(response, "Failed to fetch your pets");
  }

  static async getAllPets() {
    const response = await this.client.get("/pet/all");
    return this.unwrapResponse(response, "Failed to fetch pets");
  }
}
