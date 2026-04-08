import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import NotificationService from "../../api/NotificationService";
import ServiceProviderService from "../../api/ServiceProviderService";
import { useTheme } from "../context/ThemeContext";

type UserInfo = {
  id?: string | number;
  name?: string;
  email?: string;
  profileImageUrl?: string;
  address?: Record<string, any> | string | null;
};

type SettingRowProps = {
  icon: ReactNode;
  tint: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
  badge?: string | number | null;
  onPress: () => void;
  colors: {
    text: string;
    textMuted: string;
    textSoft: string;
    borderSoft: string;
    accent: string;
    danger: string;
  };
};

const AVATAR_FALLBACK =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80";

export default function SettingsProfile({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const { colors, isDark, setMode } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serviceDashboard, setServiceDashboard] = useState<any>(null);
  const [isServiceProvider, setIsServiceProvider] = useState(false);

  const loadSettingsData = useCallback(async () => {
    try {
      const [profileResponse, unreadResponse, dashboard, providerState] = await Promise.all([
        AuthService.getLoggedInInfo(),
        NotificationService.getUnreadCount().catch(() => 0),
        ServiceProviderService.getStoredDashboard(),
        AuthService.isServiceProvider(),
      ]);

      setUserInfo(profileResponse?.user || null);
      setUnreadCount(
        Number(unreadResponse?.count ?? unreadResponse?.unreadCount ?? unreadResponse ?? 0) || 0
      );
      setServiceDashboard(dashboard || null);
      setIsServiceProvider(Boolean(providerState));
    } catch (loadError) {
      console.error("[SettingsProfile] Failed to load settings", loadError);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        setLoading(true);
        await loadSettingsData();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    const unsubscribeUnread = NotificationService.onUnreadCountChange((count) => {
      setUnreadCount(count);
    });

    return () => {
      mounted = false;
      unsubscribeUnread();
    };
  }, [loadSettingsData]);

  const userInitial = useMemo(() => {
    const name = userInfo?.name?.trim();
    return name ? name.charAt(0).toUpperCase() : "C";
  }, [userInfo?.name]);

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await AuthService.logout();
          onNavigate?.("login");
        },
      },
    ]);
  }

  function handleAddressClick() {
    onNavigate?.(userInfo?.address ? "edit-address" : "address");
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={[styles.centerTitle, { color: colors.text }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => onNavigate?.("back")}
          >
            <Feather name="arrow-left" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Manage your account and preferences
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.cardAlt : "#0F172A",
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.profileRow}>
            {userInfo?.profileImageUrl ? (
              <Image source={{ uri: userInfo.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{userInitial}</Text>
              </View>
            )}

            <View style={styles.profileCopy}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {userInfo?.name || "CuttyPaws user"}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                {userInfo?.email || "No email available"}
              </Text>
              <View
                style={[
                  styles.profilePill,
                  {
                    backgroundColor: isDark ? colors.accentSoft : "rgba(255,255,255,0.12)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="shield-account"
                  size={14}
                  color={isDark ? colors.accent : "#0F172A"}
                />
                <Text style={[styles.profilePillText, { color: isDark ? colors.text : "#FFFFFF" }]}>
                  Account center
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Appearance</Text>

          <View style={[styles.settingRow, { borderTopColor: colors.borderSoft }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Feather name={isDark ? "moon" : "sun"} size={18} color={colors.accent} />
              </View>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>
                  Switch the app between light and dark appearance
                </Text>
              </View>
            </View>

            <Switch
              value={isDark}
              onValueChange={(value) => setMode(value ? "dark" : "light")}
              trackColor={{ false: "#D7DEE7", true: colors.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D7DEE7"
            />
          </View>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Account</Text>

          <SettingRow
            icon={<Feather name="user" size={18} color="#7C3AED" />}
            tint="#F3E8FF"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => onNavigate?.("update-profile")}
            colors={colors}
          />

          <SettingRow
            icon={<Feather name="clock" size={18} color="#2563EB" />}
            tint="#DBEAFE"
            title="Order History"
            subtitle="View your past orders and tracking"
            onPress={() => onNavigate?.("order-history")}
            colors={colors}
          />

          <SettingRow
            icon={<Ionicons name="calendar-outline" size={18} color="#059669" />}
            tint="#D1FAE5"
            title="My Service Bookings"
            subtitle="View all services you have booked"
            onPress={() => onNavigate?.("service-bookings")}
            colors={colors}
          />

          <SettingRow
            icon={<Feather name="bookmark" size={18} color="#EF4444" />}
            tint="#FEE2E2"
            title="Saved Products"
            subtitle="Items you want to buy later"
            onPress={() => onNavigate?.("profile", { tab: "saved" })}
            colors={colors}
          />

          <SettingRow
            icon={<Feather name="map-pin" size={18} color="#F97316" />}
            tint="#FFEDD5"
            title="Addresses"
            subtitle="Manage shipping addresses"
            onPress={handleAddressClick}
            colors={colors}
          />
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Services</Text>

          {isServiceProvider ? (
            <SettingRow
              icon={<Feather name="briefcase" size={18} color="#111827" />}
              tint="#E2E8F0"
              title="Service Dashboard"
              subtitle={
                serviceDashboard?.statusMessage || "Manage your service provider profile"
              }
              onPress={() => onNavigate?.("service-dashboard")}
              colors={colors}
            />
          ) : (
            <SettingRow
              icon={<Feather name="briefcase" size={18} color="#111827" />}
              tint="#E2E8F0"
              title="Become a Service Provider"
              subtitle="Apply to offer pet services on CuttyPaws"
              onPress={() => onNavigate?.("register-service-provider")}
              colors={colors}
            />
          )}

          <SettingRow
            icon={<Feather name="credit-card" size={18} color="#4F46E5" />}
            tint="#E0E7FF"
            title="Payment Methods"
            subtitle="Manage cards and payment options"
            onPress={() => onNavigate?.("payment-methods")}
            colors={colors}
          />

          <SettingRow
            icon={<Feather name="bell" size={18} color="#F59E0B" />}
            tint="#FEF3C7"
            title="Notifications"
            subtitle="Configure notification preferences"
            badge={unreadCount > 0 ? unreadCount : null}
            onPress={() => onNavigate?.("notifications")}
            colors={colors}
          />
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.text }]}>Support</Text>

          <SettingRow
            icon={<Feather name="shield" size={18} color="#10B981" />}
            tint="#D1FAE5"
            title="Privacy & Security"
            subtitle="Password, privacy, and security settings"
            onPress={() => onNavigate?.("privacy-policy")}
            colors={colors}
          />

          <SettingRow
            icon={<Feather name="help-circle" size={18} color="#0EA5E9" />}
            tint="#CFFAFE"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => onNavigate?.("customer-support")}
            colors={colors}
          />

          <SettingRow
            icon={<Feather name="log-out" size={18} color="#DC2626" />}
            tint="#FFE4E6"
            title="Logout"
            subtitle="Sign out of your account"
            danger
            onPress={handleLogout}
            colors={colors}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>CuttyPaws Version 1.0.0</Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => onNavigate?.("terms-of-service")}>
              <Text style={[styles.footerLinkText, { color: colors.accent }]}>Terms of Service</Text>
            </Pressable>
            <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
            <Pressable onPress={() => onNavigate?.("privacy-policy")}>
              <Text style={[styles.footerLinkText, { color: colors.accent }]}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  tint,
  title,
  subtitle,
  danger,
  badge,
  onPress,
  colors,
}: SettingRowProps) {
  return (
    <Pressable style={[styles.settingRow, { borderTopColor: colors.borderSoft }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconWrap, { backgroundColor: tint }]}>{icon}</View>
        <View style={styles.settingCopy}>
          <Text
            style={[
              styles.settingTitle,
              { color: danger ? colors.danger : colors.text },
              danger && styles.settingDangerTitle,
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.settingSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.settingRight}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Feather name="chevron-right" size={18} color={danger ? colors.danger : colors.textSoft} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(20, 184, 166, 0.18)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -50,
    left: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(250, 204, 21, 0.14)",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  avatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDE68A",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileEmail: {
    fontSize: 14,
    color: "#CBD5E1",
  },
  profilePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  groupCard: {
    borderRadius: 26,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  groupTitle: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  settingLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  settingDangerTitle: {
    color: "#DC2626",
  },
  settingSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    backgroundColor: "#DC2626",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footer: {
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 12,
  },
  versionText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerDot: {
    fontSize: 12,
    color: "#94A3B8",
  },
  footerLinkText: {
    fontSize: 12,
    color: "#64748B",
  },
});
