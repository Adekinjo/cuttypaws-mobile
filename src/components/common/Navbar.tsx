import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import AuthService from "../../api/AuthService";
import NotificationService from "../../api/NotificationService";
import ProductService from "../../api/ProductService";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

const logo = require("../images/Logo.png");

type Suggestion = {
  id?: string | number;
  name?: string;
  label?: string;
  title?: string;
  type?: string;
  category?: string;
  subCategory?: string;
  imageUrl?: string;
  parentCategory?: string;
  serviceType?: string;
  city?: string;
  state?: string;
  routeId?: string | number;
};

type RouteKey =
  | "home"
  | "categories"
  | "videos"
  | "login"
  | "logout"
  | "profile"
  | "notifications"
  | "cart"
  | "create-post"
  | "register-services"
  | "admin"
  | "support"
  | "seller"
  | "services";

export default function Navbar({
  unreadCount: unreadCountProp,
  onNavigate,
  onOpenCart,
  onOpenProfile,
  onOpenNotifications,
  onSubmitSearch,
  onSelectSuggestion,
}: {
  unreadCount?: number;
  onNavigate?: (route: RouteKey) => void;
  onOpenCart?: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onSubmitSearch?: (query: string) => void;
  onSelectSuggestion?: (suggestion: Suggestion) => void;
}) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const { totalItemsInCart } = useCart();
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roleDashboardRoute, setRoleDashboardRoute] = useState<RouteKey | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolveRoleRoute = (role: string | null) => {
      switch (role) {
        case "ROLE_ADMIN":
          return "admin" as const;
        case "ROLE_CUSTOMER_SUPPORT":
        case "ROLE_CUSTOMER_SERVICE":
          return "support" as const;
        case "ROLE_SELLER":
        case "ROLE_COMPANY":
          return "seller" as const;
        case "ROLE_SERVICE":
        case "ROLE_SERVICE_PROVIDER":
          return "services" as const;
        default:
          return null;
      }
    };

    const unsubscribe = AuthService.onAuthStateChange((snapshot) => {
      if (!mounted) return;
      setIsAuthenticated(snapshot.isAuthenticated);
      setRoleDashboardRoute(resolveRoleRoute(snapshot.role));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = searchValue.trim();
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const result = await ProductService.getSearchSuggestions(query);
        setSuggestions(Array.isArray(result) ? result : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const triggerNavigation = useCallback(
    async (route: RouteKey) => {
      if (route === "logout") {
        await AuthService.logout();
      }

      onNavigate?.(route);
    },
    [onNavigate]
  );

  const handleSearchSubmit = useCallback(() => {
    const query = searchValue.trim();
    if (!query) return;

    setSuggestions([]);
    setIsInputFocused(false);

    if (onSubmitSearch) {
      onSubmitSearch(query);
      return;
    }

    triggerNavigation("categories");
  }, [onSubmitSearch, searchValue, triggerNavigation]);

  const handleSuggestionPress = useCallback(
    (suggestion: Suggestion) => {
      setSearchValue("");
      setSuggestions([]);
      setIsInputFocused(false);

      if (onSelectSuggestion) {
        onSelectSuggestion(suggestion);
        return;
      }

      if (suggestion.type === "service") {
        triggerNavigation("services");
        return;
      }

      triggerNavigation("categories");
    },
    [onSelectSuggestion, triggerNavigation]
  );

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: colors.backgroundElevated,
            borderColor: colors.borderSoft,
          },
        ]}
      >
        <View style={styles.mobileHeader}>
          <Pressable style={styles.brandWrap} onPress={() => triggerNavigation("home")}>
            <Image source={logo} style={styles.logoImage} resizeMode="contain" />
          </Pressable>

          <View style={styles.mobileHeaderActions}>
            <Pressable style={styles.iconBtn} onPress={() => triggerNavigation("home")}>
              <Feather name="home" size={14} color={colors.accent} />
            </Pressable>

            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                if (isAuthenticated) {
                  if (roleDashboardRoute) {
                    triggerNavigation(roleDashboardRoute);
                  } else {
                    onOpenProfile?.();
                    triggerNavigation("profile");
                  }
                } else {
                  triggerNavigation("login");
                }
              }}
            >
              <Feather name="user" size={14} color={colors.accent} />
            </Pressable>

            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                onOpenCart?.();
                triggerNavigation("cart");
              }}
            >
              <Feather name="shopping-cart" size={14} color={colors.accent} />
              {totalItemsInCart > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{totalItemsInCart}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <View
            style={[
              styles.searchShell,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: isDark ? colors.border : "#F3D4C5",
              },
            ]}
          >
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search products, pets or posts..."
              placeholderTextColor={isDark ? colors.textSoft : "#D6886C"}
              value={searchValue}
              onChangeText={setSearchValue}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 160)}
              onSubmitEditing={handleSearchSubmit}
            />

            <Pressable style={styles.searchAction} onPress={handleSearchSubmit}>
              <Feather name="search" size={15} color={colors.accent} />
            </Pressable>

            <Pressable style={styles.searchAction}>
              <Feather name="mic" size={15} color={colors.accent} />
            </Pressable>
          </View>

          {suggestions.length > 0 && isInputFocused ? (
            <View
              style={[
                styles.suggestionsPanel,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <Pressable
                  key={`${suggestion.type}-${suggestion.id}-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <View style={[styles.suggestionIcon, { backgroundColor: colors.accentSoft }]}>
                    {suggestion.type === "product" ? (
                      <Feather name="package" size={16} color={colors.accent} />
                    ) : suggestion.type === "category" ? (
                      <Feather name="tag" size={16} color={colors.accent} />
                    ) : suggestion.type === "subcategory" ? (
                      <MaterialCommunityIcons name="shape-outline" size={18} color={colors.accent} />
                    ) : (
                      <Feather name="briefcase" size={16} color={colors.accent} />
                    )}
                  </View>

                  <View style={styles.suggestionTextWrap}>
                    <View style={styles.suggestionTitleRow}>
                      <Text numberOfLines={1} style={[styles.suggestionTitle, { color: colors.text }]}>
                        {suggestion.name || suggestion.label || suggestion.title || "Suggestion"}
                      </Text>
                      <View style={[styles.suggestionBadge, { backgroundColor: colors.accentSoft }]}>
                        <Text style={styles.suggestionBadgeText}>
                          {suggestion.type || "item"}
                        </Text>
                      </View>
                    </View>

                    <Text
                      numberOfLines={1}
                      style={[styles.suggestionMeta, { color: colors.textMuted }]}
                    >
                      {[
                        suggestion.parentCategory,
                        suggestion.serviceType,
                        suggestion.city,
                        suggestion.state,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "Quick result"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function MobileBottomNav({
  unreadCount: unreadCountProp,
  onNavigate,
  onOpenProfile,
  onOpenNotifications,
}: {
  unreadCount?: number;
  onNavigate?: (route: RouteKey) => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadCount, setUnreadCount] = useState(unreadCountProp || 0);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = AuthService.onAuthStateChange((snapshot) => {
      if (mounted) {
        setIsAuthenticated(snapshot.isAuthenticated);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = NotificationService.onUnreadCountChange((count) => {
      if (mounted) {
        setUnreadCount(count);
      }
    });

    const loadUnreadCount = async () => {
      if (typeof unreadCountProp === "number") {
        setUnreadCount(unreadCountProp);
        return;
      }

      if (!isAuthenticated) {
        setUnreadCount(0);
        return;
      }

      try {
        const res = await NotificationService.getUnreadCount();
        if (mounted) {
          setUnreadCount(NotificationService.getNormalizedUnreadCount(res));
        }
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    };

    loadUnreadCount();
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [isAuthenticated, unreadCountProp]);

  const triggerNavigation = useCallback(
    async (route: RouteKey) => {
      if (route === "logout") {
        await AuthService.logout();
      }
      onNavigate?.(route);
    },
    [onNavigate]
  );

  const handleCreatePost = useCallback(() => {
    if (!isAuthenticated) {
      triggerNavigation("login");
      return;
    }

    triggerNavigation("create-post");
  }, [isAuthenticated, triggerNavigation]);

  return (
    <View style={styles.bottomNavShell}>
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.backgroundElevated,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable style={styles.bottomItem} onPress={() => triggerNavigation("categories")}>
          <Feather name="tag" size={15} color={isDark ? colors.textMuted : "#8A8A8A"} />
          <Text style={[styles.bottomItemText, { color: isDark ? colors.textMuted : "#8A8A8A" }]}>
            Shop
          </Text>
        </Pressable>

        <Pressable style={styles.bottomItem} onPress={() => triggerNavigation("videos")}>
          <Feather name="video" size={15} color={isDark ? colors.textMuted : "#8A8A8A"} />
          <Text style={[styles.bottomItemText, { color: isDark ? colors.textMuted : "#8A8A8A" }]}>
            Videos
          </Text>
        </Pressable>

        <Pressable style={styles.bottomItem} onPress={handleCreatePost}>
          <Ionicons name="add" size={18} color={isDark ? colors.textMuted : "#8A8A8A"} />
          <Text style={[styles.bottomItemText, { color: isDark ? colors.textMuted : "#8A8A8A" }]}>
            Post
          </Text>
        </Pressable>

        <Pressable
          style={styles.bottomItem}
          onPress={() => {
            if (isAuthenticated) {
              onOpenProfile?.();
              triggerNavigation("profile");
            } else {
              triggerNavigation("login");
            }
          }}
        >
          {isAuthenticated ? (
            <Feather name="user" size={15} color={isDark ? colors.textMuted : "#8A8A8A"} />
          ) : (
            <FontAwesome5
              name="sign-in-alt"
              size={14}
              color={isDark ? colors.textMuted : "#8A8A8A"}
            />
          )}
          <Text style={[styles.bottomItemText, { color: isDark ? colors.textMuted : "#8A8A8A" }]}>
            {isAuthenticated ? "Profile" : "Login"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.bottomItem}
          onPress={() => {
            if (isAuthenticated) {
              onOpenNotifications?.();
              triggerNavigation("notifications");
            } else {
              triggerNavigation("login");
            }
          }}
        >
          <Feather name="bell" size={15} color={isDark ? colors.textMuted : "#8A8A8A"} />
          <Text style={[styles.bottomItemText, { color: isDark ? colors.textMuted : "#8A8A8A" }]}>
            Alerts
          </Text>
          {isAuthenticated && unreadCount > 0 ? (
            <View style={[styles.bottomBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  navbar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: "#F3F0EC",
  },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40
  },
  brandWrap: {
    justifyContent: "center",
    marginLeft: 0,
    padding: 0,
    left: -26,
    bottom: -15
  },
  logoImage: {
    width: 170,
    height: 84,
  },
  mobileHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#FF7B54",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  bottomBadge: {
    position: "absolute",
    top: 2,
    right: 14,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#FF7B54",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  searchWrap: {
    marginBottom: 8,
  },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F4",
    borderWidth: 1,
    borderColor: "rgba(240, 138, 99, 0.18)",
    borderRadius: 18,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    color: "#24324A",
    fontSize: 13,
    fontWeight: "500",
  },
  searchAction: {
    width: 40,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(240, 138, 99, 0.14)",
  },
  suggestionsPanel: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(240, 138, 99, 0.16)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.98)",
    padding: 6,
  },
  suggestionItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
  },
  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFF2EC",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTextWrap: {
    flex: 1,
    gap: 4,
  },
  suggestionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  suggestionTitle: {
    flex: 1,
    color: "#24324A",
    fontSize: 14,
    fontWeight: "700",
  },
  suggestionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 123, 84, 0.16)",
    backgroundColor: "#FFF1EC",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestionBadgeText: {
    color: "#D9653F",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  suggestionMeta: {
    color: "#6B7280",
    fontSize: 12,
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1ECE7",
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 7,
  },
  bottomNavShell: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
  },
  bottomItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
    position: "relative",
  },
  bottomItemText: {
    color: "#6F6F6F",
    fontSize: 10,
    fontWeight: "700",
  },
});
