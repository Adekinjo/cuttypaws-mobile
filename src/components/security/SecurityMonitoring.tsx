import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import SecurityService from "../../api/SecurityService";

type SecurityEvent = {
  id?: string | number;
  eventType?: string;
  timestamp?: string;
  description?: string;
  userEmail?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
};

type StatsState = {
  totalEvents: number;
  maliciousAttempts: number;
  failedLogins: number;
};

const REFRESH_INTERVAL_MS = 30000;

export default function SecurityMonitoring({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [stats, setStats] = useState<StatsState>({
    totalEvents: 0,
    maliciousAttempts: 0,
    failedLogins: 0,
  });
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStats = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const rawEvents = await SecurityService.getSecurityEvents();
      const normalizedEvents = Array.isArray(rawEvents)
        ? rawEvents
        : Array.isArray(rawEvents?.events)
          ? rawEvents.events
          : [];

      const maliciousAttempts = normalizedEvents.filter((event) =>
        String(event?.eventType || "").toUpperCase().includes("MALICIOUS")
      ).length;
      const failedLogins = normalizedEvents.filter((event) =>
        String(event?.eventType || "").toUpperCase().includes("FAILED")
      ).length;

      setEvents(normalizedEvents);
      setStats({
        totalEvents: normalizedEvents.length,
        maliciousAttempts,
        failedLogins,
      });
      setLastUpdated(new Date());
    } catch (loadError: any) {
      console.error("[SecurityMonitoring] Failed to load security stats", loadError);
      setError(loadError?.message || "Failed to load security stats.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const boot = async () => {
      try {
        const isAdmin = await AuthService.isAdmin();
        if (!mounted) return;

        if (!isAdmin) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAuthorized(true);
        await loadStats(true);

        interval = setInterval(() => {
          loadStats(false);
        }, REFRESH_INTERVAL_MS);
      } catch (bootError) {
        console.error("[SecurityMonitoring] Failed to initialize", bootError);
        if (mounted) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    };

    boot();

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [loadStats]);

  const riskScore = useMemo(() => {
    const value = Math.min(
      100,
      stats.maliciousAttempts * 12 + stats.failedLogins * 6 + Math.min(stats.totalEvents, 20)
    );
    return value;
  }, [stats.failedLogins, stats.maliciousAttempts, stats.totalEvents]);

  const recentEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(b?.timestamp || 0).getTime() - new Date(a?.timestamp || 0).getTime()
      )
      .slice(0, 5);
  }, [events]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.centerTitle}>Loading live monitoring...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authorized === false) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={styles.lockWrap}>
            <Feather name="lock" size={22} color="#991B1B" />
          </View>
          <Text style={styles.centerTitle}>Admin access required</Text>
          <Text style={styles.centerCopy}>
            Live security monitoring is only available to administrators.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => onNavigate?.("back")}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadStats(false)} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => onNavigate?.("back")}>
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Live Security Monitoring</Text>
            <Text style={styles.headerSubtitle}>Auto-refreshes every 30 seconds</Text>
          </View>

          <Pressable style={styles.iconButton} onPress={() => loadStats(false)}>
            <Feather name="refresh-cw" size={18} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <Text style={styles.heroEyebrow}>Realtime overview</Text>
          <Text style={styles.heroTitle}>Monitor threat pressure as it changes</Text>
          <Text style={styles.heroCopy}>
            Track event volume, malicious attempts, and failed logins from one mobile dashboard.
          </Text>

          <View style={styles.riskRow}>
            <View style={styles.riskBadge}>
              <MaterialCommunityIcons name="radar" size={15} color="#111827" />
              <Text style={styles.riskBadgeText}>Risk score {riskScore}/100</Text>
            </View>
            <Text style={styles.lastUpdatedText}>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            icon={<Feather name="shield" size={18} color="#2563EB" />}
            tint="#EFF6FF"
            title="Total Events"
            value={String(stats.totalEvents)}
            subtitle="All logged security events"
          />
          <MetricCard
            icon={<Feather name="alert-triangle" size={18} color="#D97706" />}
            tint="#FFFBEB"
            title="Malicious Attempts"
            value={String(stats.maliciousAttempts)}
            subtitle="Suspicious hostile activity"
          />
          <MetricCard
            icon={<Feather name="x-octagon" size={18} color="#DC2626" />}
            tint="#FEF2F2"
            title="Failed Logins"
            value={String(stats.failedLogins)}
            subtitle="Rejected authentication events"
          />
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to refresh monitoring</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Event Pulse</Text>
            <Text style={styles.sectionSubtitle}>Latest 5 security events</Text>
          </View>

          {recentEvents.length ? (
            <View style={styles.recentList}>
              {recentEvents.map((event) => {
                const severity = getEventSeverity(event.eventType);
                const severityMeta = getSeverityMeta(severity);
                return (
                  <View key={String(event.id)} style={styles.recentCard}>
                    <View style={styles.recentTopRow}>
                      <View
                        style={[
                          styles.severityPill,
                          { backgroundColor: severityMeta.backgroundColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityPillText,
                            { color: severityMeta.textColor },
                          ]}
                        >
                          {event.eventType || "UNKNOWN"}
                        </Text>
                      </View>
                      <Text style={styles.recentTime}>{formatDateTime(event.timestamp)}</Text>
                    </View>

                    <Text style={styles.recentUser}>{event.userEmail || "unknown"}</Text>
                    <Text style={styles.recentMeta}>
                      {(event.city || "Unknown city") + ", " + (event.country || "Unknown country")}
                    </Text>
                    <Text style={styles.recentMeta}>{event.ipAddress || "Unknown IP"}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Feather name="activity" size={22} color="#0F766E" />
              </View>
              <Text style={styles.emptyTitle}>No recent events</Text>
              <Text style={styles.emptyCopy}>
                No security events were returned for the live monitoring snapshot.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monitoring Notes</Text>
            <Text style={styles.sectionSubtitle}>What this screen is watching</Text>
          </View>

          <View style={styles.noteList}>
            <NoteRow
              icon="shield-checkmark-outline"
              title="Event ingestion"
              copy="The screen polls the admin security event stream every 30 seconds."
            />
            <NoteRow
              icon="warning-outline"
              title="Malicious attempts"
              copy="Counts events whose type includes MALICIOUS to surface overt hostile behavior."
            />
            <NoteRow
              icon="close-circle-outline"
              title="Failed logins"
              copy="Tracks FAILED event types to identify login pressure or credential stuffing."
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  tint,
  title,
  value,
  subtitle,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: tint }]}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

function NoteRow({
  icon,
  title,
  copy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
}) {
  return (
    <View style={styles.noteRow}>
      <View style={styles.noteIconWrap}>
        <Ionicons name={icon} size={17} color="#0F766E" />
      </View>
      <View style={styles.noteCopy}>
        <Text style={styles.noteTitle}>{title}</Text>
        <Text style={styles.noteText}>{copy}</Text>
      </View>
    </View>
  );
}

function getEventSeverity(eventType?: string) {
  const value = String(eventType || "").toUpperCase();
  if (value.includes("SQL") || value.includes("XSS")) return "critical";
  if (value.includes("MALICIOUS")) return "high";
  return "medium";
}

function getSeverityMeta(severity: "critical" | "high" | "medium") {
  if (severity === "critical") {
    return { backgroundColor: "#FEE2E2", textColor: "#B91C1C" };
  }
  if (severity === "high") {
    return { backgroundColor: "#FEF3C7", textColor: "#A16207" };
  }
  return { backgroundColor: "#DBEAFE", textColor: "#1D4ED8" };
}

function formatDateTime(timestamp?: string) {
  if (!timestamp) return "N/A";
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return timestamp;
  }
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
    paddingHorizontal: 28,
    gap: 12,
  },
  lockWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  centerCopy: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconButton: {
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
    backgroundColor: "#111827",
  },
  heroGlowOne: {
    position: "absolute",
    top: -28,
    right: -18,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(59,130,246,0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -48,
    left: -24,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(239,68,68,0.14)",
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#93C5FD",
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroCopy: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#E5E7EB",
  },
  riskRow: {
    marginTop: 16,
    gap: 10,
  },
  riskBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FDE68A",
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#CBD5E1",
  },
  metricGrid: {
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: 24,
    padding: 16,
  },
  metricIcon: {
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },
  errorCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FEE2E2",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#991B1B",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#991B1B",
  },
  sectionCard: {
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  recentList: {
    gap: 12,
  },
  recentCard: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  severityPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  severityPillText: {
    fontSize: 12,
    fontWeight: "800",
  },
  recentTime: {
    fontSize: 12,
    color: "#64748B",
  },
  recentUser: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  recentMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 28,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyCopy: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },
  noteList: {
    gap: 12,
  },
  noteRow: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 20,
    padding: 14,
    backgroundColor: "#F8FAFC",
  },
  noteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFEFF",
  },
  noteCopy: {
    flex: 1,
    gap: 4,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
  },
});
