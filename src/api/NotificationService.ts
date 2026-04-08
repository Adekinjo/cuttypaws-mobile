import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import ApiService from "./ApiService";
import { storage } from "../utils/storage";

type PushRoute =
  | { route: "/(tabs)/notifications" }
  | { route: "/(tabs)/post/[id]"; params: { id: string } }
  | { route: "/(tabs)/notifications"; params?: Record<string, string> };

export default class NotificationService extends ApiService {
  static notificationsModulePromise: Promise<typeof import("expo-notifications")> | null = null;
  static reconnectAttempts = 0;
  static maxReconnectAttempts = 5;
  static isConnected = false;
  static hasWarnedRealtimeUnavailable = false;
  static connectionCallbacks = new Set<(connected: boolean) => void>();
  static unreadCount = 0;
  static unreadCountCallbacks = new Set<(count: number) => void>();
  static receivedSubscription: { remove: () => void } | null = null;
  static responseSubscription: { remove: () => void } | null = null;

  static async getNotificationsModule() {
    if (!this.notificationsModulePromise) {
      this.notificationsModulePromise = import("expo-notifications");
    }

    return this.notificationsModulePromise;
  }

  static onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  static onUnreadCountChange(callback: (count: number) => void) {
    this.unreadCountCallbacks.add(callback);
    callback(this.unreadCount);
    return () => this.unreadCountCallbacks.delete(callback);
  }

  static notifyConnectionChange(connected: boolean) {
    this.isConnected = connected;
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  static notifyUnreadCountChange(count: number) {
    this.unreadCount = Math.max(0, Number(count) || 0);
    this.unreadCountCallbacks.forEach((callback) => callback(this.unreadCount));
  }

  static incrementUnreadCount(delta = 1) {
    this.notifyUnreadCountChange(this.unreadCount + delta);
  }

  static getNormalizedUnreadCount(payload: any) {
    return Number(
      payload?.unreadCount ??
        payload?.count ??
        payload?.total ??
        payload?.totalComments ??
        0
    ) || 0;
  }

  static async configureForegroundNotifications() {
    const Notifications = await this.getNotificationsModule();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  static async registerForPushNotificationsAsync() {
    const Notifications = await this.getNotificationsModule();

    if (!Device.isDevice) {
      return { token: null, error: "Push notifications require a physical device." };
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0F766E",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      return { token: null, error: "Notification permission was not granted." };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      undefined;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return { token: tokenResponse.data, error: null };
  }

  static async registerPushTokenWithBackend(token: string) {
    try {
      const response = await this.client.post(
        "/notifications/push-token",
        { token },
        { validateStatus: () => true }
      );
      return response.data;
    } catch (error) {
      return this.fallbackErrorHandler(error);
    }
  }

  static async syncPushTokenRegistration() {
    const { token, error } = await this.registerForPushNotificationsAsync();

    if (!token) {
      return { token: null, error };
    }

    const storedToken = await storage.getPushToken();
    if (storedToken === token) {
      return { token, error: null, skipped: true };
    }

    const response = await this.registerPushTokenWithBackend(token);
    if (response?.status === 200 || response?.message?.toLowerCase().includes("registered")) {
      await storage.setPushToken(token);
    }

    return { token, error: null, skipped: false, response };
  }

  static async removePushTokenFromBackend(token: string) {
    try {
      const response = await this.client.delete("/notifications/push-token", {
        data: { token },
        validateStatus: () => true,
      });
      return response.data;
    } catch (error) {
      return this.fallbackErrorHandler(error);
    }
  }

  static async unregisterStoredPushToken() {
    const storedToken = await storage.getPushToken();
    if (!storedToken) {
      return;
    }

    try {
      await this.removePushTokenFromBackend(storedToken);
    } finally {
      await storage.removePushToken();
    }
  }

  static initializePushNotifications({
    onNotificationReceived,
    onNotificationResponse,
  }: {
    onNotificationReceived?: (notification: any) => void;
    onNotificationResponse?: (response: any) => void;
  } = {}) {
    void this.configureForegroundNotifications();

    void this.getNotificationsModule().then((Notifications) => {
      if (!this.receivedSubscription) {
        this.receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
          this.incrementUnreadCount(1);
          onNotificationReceived?.(notification);
        });
      }

      if (!this.responseSubscription) {
        this.responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          onNotificationResponse?.(response);
        });
      }
    });
  }

  static connect(_onNotificationReceived?: (payload: any) => void) {
    if (!this.hasWarnedRealtimeUnavailable) {
      console.warn(
        "[NotificationService] Realtime SockJS/Stomp notifications are not configured for React Native in this port. Use the REST notification methods or add an Expo-compatible websocket/STOMP client."
      );
      this.hasWarnedRealtimeUnavailable = true;
    }
    this.notifyConnectionChange(false);
  }

  static disconnect() {
    this.notifyConnectionChange(false);
    this.reconnectAttempts = 0;
  }

  static cleanupPushNotificationListeners() {
    this.receivedSubscription?.remove();
    this.responseSubscription?.remove();
    this.receivedSubscription = null;
    this.responseSubscription = null;
  }

  static getConnectionStatus() {
    return this.isConnected;
  }

  static getPushDataFromResponse(response: any) {
    return (
      response?.notification?.request?.content?.data ||
      {}
    ) as Record<string, any>;
  }

  static getPushRouteFromData(data: Record<string, any>): PushRoute {
    const type = String(data?.type || "").toUpperCase();
    const postId = data?.postId != null ? String(data.postId) : "";
    const senderId = data?.senderId != null ? String(data.senderId) : "";

    switch (type) {
      case "NEW_POST":
      case "POST_LIKE":
      case "COMMENT":
      case "REPLY":
      case "COMMENT_LIKE":
      case "COMMENT_REACTION":
        if (postId) {
          return {
            route: "/(tabs)/post/[id]",
            params: { id: postId },
          };
        }
        return { route: "/(tabs)/notifications" };
      case "FOLLOW":
        if (senderId) {
          return {
            route: "/(tabs)/notifications",
            params: { userId: senderId },
          };
        }
        return { route: "/(tabs)/notifications" };
      default:
        return { route: "/(tabs)/notifications" };
    }
  }

  static async getMyNotifications(page = 0, size = 20) {
    try {
      const response = await this.client.get("/notifications", {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw this.fallbackErrorHandler(error);
    }
  }

  static async getUnreadCount() {
    try {
      const response = await this.client.get("/notifications/unread-count");
      this.notifyUnreadCountChange(this.getNormalizedUnreadCount(response.data));
      return response.data;
    } catch (error) {
      throw this.fallbackErrorHandler(error);
    }
  }

  static async markRead(notificationId: string) {
    try {
      const response = await this.client.put(`/notifications/${notificationId}/read`, {});
      if (response.data?.status === 200) {
        this.notifyUnreadCountChange(this.unreadCount - 1);
      }
      return response.data;
    } catch (error) {
      throw this.fallbackErrorHandler(error);
    }
  }

  static async markAllRead() {
    try {
      const response = await this.client.put("/notifications/read-all", {});
      if (response.data?.status === 200) {
        this.notifyUnreadCountChange(0);
      }
      return response.data;
    } catch (error) {
      throw this.fallbackErrorHandler(error);
    }
  }

  static fallbackErrorHandler(error: any) {
    if (error?.response) {
      return error.response.data;
    }
    if (error?.request) {
      return { message: "Network error: Unable to connect to server" };
    }
    return { message: error?.message || "An unexpected error occurred" };
  }

  static async subscribeToNewsletter(email: string) {
    try {
      const response = await this.client.post("/newsletter/subscribe", null, {
        params: { email },
      });
      return response.data;
    } catch (error) {
      throw this.fallbackErrorHandler(error);
    }
  }

  static async unsubscribeFromNewsletter(email: string) {
    try {
      const response = await this.client.post("/newsletter/unsubscribe", null, {
        params: { email },
      });
      return response.data;
    } catch (error) {
      throw this.fallbackErrorHandler(error);
    }
  }
}
