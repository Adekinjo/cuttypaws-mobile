import { Stack, router } from "expo-router";
import Constants from "expo-constants";
import { useEffect } from "react";

import AuthService from "../../src/api/AuthService";
import NotificationService from "../../src/api/NotificationService";

export default function TabsLayout() {
  useEffect(() => {
    let active = true;

    const initializeNotifications = async () => {
      NotificationService.initializePushNotifications({
        onNotificationResponse: (response) => {
          const data = NotificationService.getPushDataFromResponse(response);
          const destination = NotificationService.getPushRouteFromData(data);

          if (destination.route === "/(tabs)/post/[id]" && destination.params?.id) {
            router.push({
              pathname: destination.route,
              params: destination.params,
            });
            return;
          }

          router.push({
            pathname: destination.route,
            params: destination.params,
          });
        },
      });

      try {
        const isAuthenticated = await AuthService.isAuthenticated();
        if (!isAuthenticated || !active) {
          return;
        }

        const { token, error } = await NotificationService.syncPushTokenRegistration();
        if (!active) return;

        if (token) {
          return;
        } else if (
          error &&
          error !== "Push notifications require a physical device." &&
          Constants.appOwnership !== "expo"
        ) {
          console.warn("[TabsLayout] Push notifications not fully configured:", error);
        }
      } catch (setupError) {
        console.warn("[TabsLayout] Failed to initialize push notifications", setupError);
      }
    };

    initializeNotifications();

    return () => {
      active = false;
      NotificationService.cleanupPushNotificationListeners();
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
