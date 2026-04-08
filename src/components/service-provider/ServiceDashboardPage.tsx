import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthService from "../../api/AuthService";
import ServiceProviderService from "../../api/ServiceProviderService";
import DashboardHeader from "./DashboardHeader";
import PerformanceInsightsCard from "./PerformanceInsightsCard";
import QuickActions from "./QuickActions";
import ServiceProfileCard from "./ServiceProfileCard";
import ServiceStatusBanner from "./ServiceStatusBanner";
import StatsCards from "./StatsCards";
import SubscriptionCard from "./SubscriptionCard";

type Props = {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
};

export default function ServiceDashboardPage({ onNavigate }: Props) {
  const [isServiceProvider, setIsServiceProvider] = useState<boolean | null>(null);
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async (options?: { refresh?: boolean }) => {
      const refresh = Boolean(options?.refresh);
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const providerFlag = await AuthService.isServiceProvider();
        setIsServiceProvider(providerFlag);

        if (!providerFlag) {
          setDashboard(null);
          setError("");
          return;
        }

        if (!refresh) {
          const cachedDashboard = await ServiceProviderService.getStoredDashboard();
          if (cachedDashboard) {
            setDashboard(cachedDashboard);
          }
        }

        const liveDashboard = await ServiceProviderService.refreshDashboard();
        setDashboard(liveDashboard);
        setError("");
      } catch (err: any) {
        const fallback = await ServiceProviderService.getStoredDashboard();
        if (fallback) {
          setDashboard(fallback);
        }
        setError(err?.response?.data?.message || err?.message || "Unable to load service dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const publicProfileUserId = useMemo(() => {
    return dashboard?.serviceProfile?.userId || dashboard?.serviceProfile?.ownerId || null;
  }, [dashboard]);

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.centerTitle}>Loading service dashboard...</Text>
          <Text style={styles.centerBody}>
            Pulling your approval status, profile summary, and service tools.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isServiceProvider === false) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={styles.centerIcon}>
            <MaterialCommunityIcons name="storefront-outline" size={28} color="#92400E" />
          </View>
          <Text style={styles.centerTitle}>Service account required</Text>
          <Text style={styles.centerBody}>
            This account is not registered as a service provider yet.
          </Text>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => onNavigate?.("register-service-provider")}
          >
            <Text style={styles.secondaryActionText}>Register Service</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard({ refresh: true })}
            tintColor="#1D4ED8"
          />
        }
      >
        <Text style={styles.kicker}>Service Studio</Text>
        <DashboardHeader
          dashboard={dashboard}
          onEdit={() => onNavigate?.("service-profile-edit")}
          onRefresh={() => loadDashboard({ refresh: true })}
          refreshing={refreshing}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-triangle" size={18} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <ServiceStatusBanner dashboard={dashboard} />
        <StatsCards dashboard={dashboard} />
        <Text style={styles.sectionTitle}>Profile Overview</Text>
        <ServiceProfileCard profile={dashboard?.serviceProfile} />

        <Text style={styles.sectionTitle}>Growth Tools</Text>
        <QuickActions
          dashboard={dashboard}
          onEdit={() => onNavigate?.("service-profile-edit")}
          onViewPublicProfile={() =>
            publicProfileUserId
              ? onNavigate?.("service-public-profile", { userId: String(publicProfileUserId) })
              : undefined
          }
          onManageAdverts={() => onNavigate?.("service-ads")}
        />

        <SubscriptionCard
          subscription={dashboard?.activeAdSubscription}
          onUpgrade={() => onNavigate?.("service-ads")}
        />

        <Text style={styles.sectionTitle}>Insights</Text>
        <PerformanceInsightsCard profile={dashboard?.serviceProfile} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FF",
  },
  content: {
    padding: 16,
    paddingBottom: 42,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: "#F5F8FF",
  },
  kicker: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#5B6CFF",
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 10,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#64748B",
    textTransform: "uppercase",
  },
  centerIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  centerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  centerBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  secondaryAction: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 22,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FDA4AF",
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
    fontWeight: "600",
  },
});
