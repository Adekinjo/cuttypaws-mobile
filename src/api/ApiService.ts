import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { storage } from "../utils/storage";

type JwtPayload = {
  exp?: number;
  userId?: string;
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
};

export default class ApiService {
  static BASE_URL = "https://cuttypawsbackend.onrender.com";

  static client = axios.create({
    baseURL: ApiService.BASE_URL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  static async getHeader() {
    const token = await storage.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token && token.trim().length > 10) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwtDecode<JwtPayload>(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  static async validateToken() {
    const token = await storage.getToken();
    if (!token) return false;

    const parts = token.split(".");
    if (parts.length !== 3) {
      await storage.clearAuth();
      return false;
    }

    return true;
  }

  static async getCurrentUser() {
    try {
      const token = await storage.getToken();
      if (!token) return null;

      const payload = this.decodeToken(token);
      if (!payload) return null;

      return {
        id: payload.userId || payload.sub || null,
        email: payload.email || null,
        name: payload.name || null,
        role: payload.role || null,
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  static async getUserId() {
    const token = await storage.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.userId || payload?.sub || null;
  }

  static async isAuthenticated() {
    const token = await storage.getToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;

    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  }
}