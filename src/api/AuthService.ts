import ApiService from "../api/ApiService";
import NotificationService from "./NotificationService";
import { storage } from "../utils/storage";

type LoginDetails = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

type VerifyData = {
  email: string;
  password: string;
  rememberMe?: boolean;
  verificationCode: string;
};

type ResendVerificationData = {
  email: string;
  password: string;
};

type AuthSnapshot = {
  isAuthenticated: boolean;
  user: any | null;
  role: string | null;
};

export default class AuthService extends ApiService {
  static interceptorsInitialized = false;
  static authStateCallbacks = new Set<(snapshot: AuthSnapshot) => void>();

  static onAuthStateChange(callback: (snapshot: AuthSnapshot) => void) {
    this.authStateCallbacks.add(callback);
    void this.getAuthSnapshot()
      .then((snapshot) => callback(snapshot))
      .catch(() => {
        callback({
          isAuthenticated: false,
          user: null,
          role: null,
        });
      });

    return () => {
      this.authStateCallbacks.delete(callback);
    };
  }

  static async getAuthSnapshot(): Promise<AuthSnapshot> {
    const isAuthenticated = await this.isAuthenticated();
    const user = isAuthenticated ? await this.getCurrentUser() : null;
    const role = isAuthenticated
      ? user?.role || user?.userRole || (await this.getRoleFromToken()) || (await storage.getRole())
      : null;

    return {
      isAuthenticated,
      user,
      role: role ? String(role) : null,
    };
  }

  static async notifyAuthStateChange() {
    const snapshot = await this.getAuthSnapshot();
    this.authStateCallbacks.forEach((callback) => callback(snapshot));
  }

  static async persistAuthPayload(data: any) {
    if (data?.token) {
      await storage.setToken(data.token);
    }

    if (data?.refreshToken) {
      await storage.setRefreshToken(data.refreshToken);
    }

    if (data?.user) {
      await storage.setUser(data.user);
    } else if (data?.token) {
      await this.getCurrentUser();
    }

    if (data?.role) {
      await storage.setRole(data.role);
    } else if (data?.user?.role || data?.user?.userRole) {
      await storage.setRole(data.user.role || data.user.userRole);
    }

    await this.notifyAuthStateChange();
  }

  static async logAuthState(context: string, extra: Record<string, any> = {}) {
    const token = await storage.getToken();
    const refreshToken = await storage.getRefreshToken();
    const storedUser = await storage.getUser();

    console.log(`[AuthService] ${context}`, {
      hasToken: Boolean(token),
      tokenLength: token?.length || 0,
      hasRefreshToken: Boolean(refreshToken),
      refreshTokenLength: refreshToken?.length || 0,
      hasStoredUser: Boolean(storedUser),
      ...extra,
    });
  }

  static async getRoleFromToken() {
    const token = await storage.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.role || null;
  }

  static async getStoredUser<T = any>() {
    try {
      return await storage.getUser<T>();
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  }

  static async getCurrentUser() {
    const storedUser = await this.getStoredUser<any>();
    if (storedUser?.id) {
      return storedUser;
    }

    const token = await storage.getToken();
    if (token) {
      const payload = this.decodeToken(token);
      const derivedUser = {
        id: payload?.userId || payload?.sub || null,
        email: payload?.email || null,
        name: payload?.name || null,
        role: payload?.role || null,
      };

      if (derivedUser.id || derivedUser.email) {
        await this.setStoredUser(derivedUser);
        if (derivedUser.role) {
          await storage.setRole(derivedUser.role);
        }
        return derivedUser;
      }
    }

    if (!(await this.isAuthenticated())) {
      return null;
    }

    try {
      const response = await this.getLoggedInInfo();
      return response?.user || null;
    } catch (error) {
      console.error("[AuthService] getCurrentUser fallback failed:", error);
      return null;
    }
  }

  static async setStoredUser(user: unknown) {
    if (!user) {
      await storage.removeUser();
      return;
    }

    await storage.setUser(user);
  }

  static async getEffectiveRole() {
    const storedUser = await this.getStoredUser();
    return (
      (await this.getRoleFromToken()) ||
      storedUser?.role ||
      storedUser?.userRole ||
      (await storage.getRole()) ||
      null
    );
  }

  static async hasRole(...roles: string[]) {
    const effectiveRole = await this.getEffectiveRole();
    return !!effectiveRole && roles.includes(effectiveRole);
  }

  static async registerUser(registration: Record<string, any>) {
    const response = await this.client.post("/auth/register", registration);
    return response.data;
  }

  static async verifyCode(verifyData: VerifyData) {
    const response = await this.client.post("/auth/login", verifyData);
    const data = response.data;

    if (data?.token || data?.refreshToken || data?.user) {
      await this.persistAuthPayload(data);
    }

    return data;
  }

  static async loginUser(loginDetails: LoginDetails) {
    await this.logAuthState("loginUser:request", {
      email: loginDetails?.email,
      rememberMe: loginDetails?.rememberMe,
    });

    const response = await this.client.post("/auth/login", loginDetails);
    const data = response.data;

    await this.persistAuthPayload(data);

    return data;
  }

  static async requestPasswordReset(email: string) {
    const response = await this.client.post("/auth/request-password-reset", null, {
      params: { email },
    });
    return response.data;
  }

  static async resetPassword(token: string, newPassword: string) {
    const response = await this.client.post("/auth/reset-password", null, {
      params: { token, newPassword },
    });
    return response.data;
  }

  static async refreshToken(refreshToken?: string) {
    const storedRefreshToken = refreshToken || (await storage.getRefreshToken());

    if (!storedRefreshToken) {
      throw new Error("No refresh token found");
    }

    const response = await this.client.post("/auth/refresh-token", null, {
      params: { refreshToken: storedRefreshToken },
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data;

    await this.persistAuthPayload(data);

    return data;
  }

  static async resendVerificationCode(
    resendVerificationData: ResendVerificationData
  ) {
    const response = await this.client.post(
      "/auth/resend-verification",
      resendVerificationData
    );
    return response.data;
  }

  static async updateUserProfile(userDto: Record<string, any>) {
    const response = await this.client.put("/user/update", userDto);
    return response.data;
  }

  static async getLoggedInInfo() {
    const response = await this.client.get("/user/my-info");
    const data = response.data;

    if (data?.user) {
      await storage.setUser(data.user);
    }

    if (data?.role) {
      await storage.setRole(data.role);
    } else if (data?.user?.role || data?.user?.userRole) {
      await storage.setRole(data.user.role || data.user.userRole);
    }

    return data;
  }

  static async getUserInfoAndOrderHistory() {
    return this.getLoggedInInfo();
  }

  static async updateUserProfilePicture(formData: FormData) {
    const token = await storage.getToken();

    const response = await this.client.put("/user/update-profile-image", formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    return response.data;
  }

  static async updateCoverPicture(formData: FormData) {
    const token = await storage.getToken();

    const response = await this.client.put("/user/update-cover-image", formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    return response.data;
  }

  static async saveAddress(body: Record<string, any>) {
    const response = await this.client.post("/address/save", body);
    return response.data;
  }

  static async getAllUsers() {
    try {
      const response = await this.client.get("/user/get-all-info");
      const responseData = response.data;

      if (responseData?.userList) return responseData.userList;
      if (responseData?.data) return responseData.data;
      if (Array.isArray(responseData)) return responseData;
      return [];
    } catch (error: any) {
      if (error?.response?.status === 404) {
        const fallbackResponse = await this.client.get("/users/get-all");
        const fallbackData = fallbackResponse.data;

        if (fallbackData?.userList) return fallbackData.userList;
        if (fallbackData?.data) return fallbackData.data;
        if (Array.isArray(fallbackData)) return fallbackData;
        return [];
      }

      throw error;
    }
  }

  static async isTokenExpired(bufferSeconds = 60) {
    const token = await storage.getToken();
    if (!token) return true;

    const payload = this.decodeToken(token);
    if (!payload?.exp) return false;

    const expiryMs = payload.exp * 1000;
    return Date.now() >= expiryMs - bufferSeconds * 1000;
  }

  static async refreshTokenIfNeeded() {
    const token = await storage.getToken();
    if (!token) return false;

    const expired = await this.isTokenExpired();
    if (!expired) return true;

    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      await this.refreshToken(refreshToken);
      return true;
    } catch (error) {
      console.error("refreshTokenIfNeeded failed:", error);
      return false;
    }
  }

  static async setupAxiosInterceptors(onUnauthorized?: () => void) {
    if (this.interceptorsInitialized) return;
    this.interceptorsInitialized = true;

    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (token: string) => void;
      reject: (error: any) => void;
    }> = [];

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach((promise) => {
        if (error) {
          promise.reject(error);
        } else if (token) {
          promise.resolve(token);
        }
      });
      failedQueue = [];
    };

    this.client.interceptors.request.use(
      async (config) => {
        const token = await storage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error?.response?.status === 401 && !originalRequest?._retry) {
          if (isRefreshing) {
            return new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          const refreshToken = await storage.getRefreshToken();
          if (!refreshToken) {
            await this.logout();
            if (onUnauthorized) onUnauthorized();
            return Promise.reject(error);
          }

          try {
            const refreshResponse = await this.refreshToken(refreshToken);
            const newToken = refreshResponse.token;

            processQueue(null, newToken);
            isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            await this.logout();
            if (onUnauthorized) onUnauthorized();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  static async getUserId() {
    const token = await storage.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    return payload?.userId || payload?.sub || null;
  }

  static async logout() {
    try {
      await NotificationService.unregisterStoredPushToken();
    } catch (error) {
      console.warn("[AuthService] Failed to unregister push token during logout", error);
    }
    await storage.clearAuth();
    await this.notifyAuthStateChange();
  }

  static async isAuthenticated() {
    const token = await storage.getToken();
    const refreshToken = await storage.getRefreshToken();
    return Boolean(token || refreshToken);
  }

  static async isAdmin() {
    return this.hasRole("ROLE_ADMIN");
  }

  static async isSupport() {
    return this.hasRole("ROLE_CUSTOMER_SUPPORT", "ROLE_CUSTOMER_SERVICE");
  }

  static async isSeller() {
    return this.hasRole("ROLE_SELLER", "ROLE_COMPANY");
  }

  static async isServiceProvider() {
    const storedUser = await this.getStoredUser();
    const matchedRole = await this.hasRole("ROLE_SERVICE", "ROLE_SERVICE_PROVIDER");
    const matchedFlag = Boolean(storedUser?.isServiceProvider);
    return matchedRole || matchedFlag;
  }

  static async initializeApp(onUnauthorized?: () => void) {
    await this.setupAxiosInterceptors(onUnauthorized);

    const token = await storage.getToken();
    const refreshToken = await storage.getRefreshToken();

    if (token && refreshToken) {
      await this.refreshTokenIfNeeded();
    }

    await this.notifyAuthStateChange();
  }
}
