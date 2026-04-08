import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { cloneElement, isValidElement, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import Navbar, { MobileBottomNav } from "./Navbar";

export default function TabScaffold({
  children,
  backgroundColor,
  compactNav = false,
}: {
  children: ReactNode;
  backgroundColor?: string;
  compactNav?: boolean;
}) {
  const { colors } = useTheme();
  const resolvedBackgroundColor = backgroundColor ?? colors.background;

  const handleRoute = (route: string, params?: Record<string, any>) => {
    switch (route) {
      case "back":
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/profile");
        }
        break;
      case "home":
        router.replace("/(tabs)");
        break;
      case "notifications":
        router.push("/(tabs)/notifications");
        break;
      case "categories":
        router.push("/(tabs)/categories");
        break;
      case "videos":
        router.push("/(tabs)/videos");
        break;
      case "cart":
        router.push("/(tabs)/cart");
        break;
      case "profile":
        router.push("/(tabs)/profile");
        break;
      case "customer-profile":
        if (params?.userId) {
          router.push(`/(tabs)/customer-profile/${params.userId}`);
        }
        break;
      case "service-public-profile":
        if (params?.userId) {
          router.push(`/(tabs)/service-public-profile/${params.userId}`);
        }
        break;
      case "settings-profile":
        router.push("/(tabs)/settings-profile");
        break;
      case "order-history":
        router.push("/(tabs)/order-history");
        break;
      case "order-details":
        if (params?.itemId) {
          router.push(`/(tabs)/order-details/${params.itemId}`);
        }
        break;
      case "payment-success":
        router.push("/payment-success");
        break;
      case "my-service-bookings":
        router.push("/(tabs)/my-service-bookings");
        break;
      case "admin":
        router.push("/(tabs)/admin");
        break;
      case "support":
        router.push("/(tabs)/notifications");
        break;
      case "seller":
        router.push("/(tabs)/seller");
        break;
      case "services":
        router.push("/(tabs)/services");
        break;
      case "service-ads":
        router.push("/service-ads");
        break;
      case "create-post":
        router.push("/(tabs)/create-post");
        break;
      case "ai-help":
        router.push("/(tabs)/ai-help");
        break;
      case "category-product":
        if (params?.categoryId) {
          const categoryName = params?.categoryName
            ? `?categoryName=${encodeURIComponent(String(params.categoryName))}`
            : "";
          router.push(`/(tabs)/category/${params.categoryId}${categoryName}`);
        }
        break;
      case "products-sub-category":
        if (params?.subCategoryId) {
          router.push(`/(tabs)/subcategory/${params.subCategoryId}`);
        }
        break;
      case "product-details":
        if (params?.productId) {
          router.push(`/(tabs)/product/${params.productId}`);
        }
        break;
      case "post-details":
        if (params?.postId) {
          router.push(`/(tabs)/post/${params.postId}`);
        }
        break;
      case "login":
        router.push("/login");
        break;
      case "logout":
        router.replace("/");
        break;
      default:
        if (params?.postId) {
          router.replace("/(tabs)");
        }
        break;
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: resolvedBackgroundColor }]}
      edges={["top"]}
    >
      <StatusBar style={colors.statusBar} />
      <View style={[styles.container, { backgroundColor: resolvedBackgroundColor }]}>
        <View
          style={[
            styles.navWrap,
            compactNav && styles.navWrapCompact,
            { backgroundColor: resolvedBackgroundColor },
          ]}
        >
          <Navbar
            onNavigate={handleRoute as any}
            onOpenNotifications={() => router.push("/(tabs)/notifications")}
          />
        </View>

        <View style={styles.content}>
          {isValidElement(children)
            ? cloneElement(children as any, {
                onNavigate: handleRoute,
              })
            : children}
        </View>

        <MobileBottomNav
          onNavigate={handleRoute as any}
          onOpenNotifications={() => router.push("/(tabs)/notifications")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  navWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  navWrapCompact: {
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    paddingBottom: 84,
  },
});
