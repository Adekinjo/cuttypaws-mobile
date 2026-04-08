import * as SecureStore from "expo-secure-store";
import keyValueStorage from "./keyValueStorage";

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";
const ROLE_KEY = "role";
const PUSH_TOKEN_KEY = "pushToken";
const THEME_MODE_KEY = "themeMode";
const RECENT_AI_VIEWS_KEY = "recentAiViews";

export const storage = {
  async setToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async setRefreshToken(token: string) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async removeRefreshToken() {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUser(user: unknown) {
    await keyValueStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser<T = any>() {
    const raw = await keyValueStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async removeUser() {
    await keyValueStorage.removeItem(USER_KEY);
  },

  async setRole(role: string) {
    await SecureStore.setItemAsync(ROLE_KEY, role);
  },

  async getRole() {
    return await SecureStore.getItemAsync(ROLE_KEY);
  },

  async removeRole() {
    await SecureStore.deleteItemAsync(ROLE_KEY);
  },

  async setPushToken(token: string) {
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  },

  async getPushToken() {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  },

  async removePushToken() {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  },

  async setThemeMode(mode: "light" | "dark") {
    await SecureStore.setItemAsync(THEME_MODE_KEY, mode);
  },

  async getThemeMode() {
    return (await SecureStore.getItemAsync(THEME_MODE_KEY)) as "light" | "dark" | null;
  },

  async removeThemeMode() {
    await SecureStore.deleteItemAsync(THEME_MODE_KEY);
  },

  async setRecentAiViews(items: unknown[]) {
    await keyValueStorage.setItem(RECENT_AI_VIEWS_KEY, JSON.stringify(items));
  },

  async getRecentAiViews<T = any>() {
    const raw = await keyValueStorage.getItem(RECENT_AI_VIEWS_KEY);
    return raw ? (JSON.parse(raw) as T[]) : [];
  },

  async clearRecentAiViews() {
    await keyValueStorage.removeItem(RECENT_AI_VIEWS_KEY);
  },

  async clearAuth() {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(ROLE_KEY),
      SecureStore.deleteItemAsync(PUSH_TOKEN_KEY),
      keyValueStorage.removeItem(USER_KEY),
      keyValueStorage.removeItem(RECENT_AI_VIEWS_KEY),
    ]);
  },
};
