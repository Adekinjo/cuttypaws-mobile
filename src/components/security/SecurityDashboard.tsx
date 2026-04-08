import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
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
  isp?: string;
};

type MaliciousUser = {
  email?: string;
  isRegistered?: boolean;
  riskLevel?: number;
  userName?: string;
  userRole?: string;
  eventCount?: number;
  ipCount?: number;
  ipAddresses?: string[] | Set<string>;
};

export default function SecurityDashboard({
  onNavigate,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
}) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [maliciousUsers, setMaliciousUsers] = useState<MaliciousUser[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [blockingEmail, setBlockingEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

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
        await loadAllData();
      } catch (bootError) {
        console.error("[SecurityDashboard] Failed to initialize", bootError);
        if (mounted) {
          setAuthorized(false);
          setLoading(false);
        }
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      setError("");

      const [eventsData, usersData] = await Promise.all([
        SecurityService.getSecurityEvents(),
        SecurityService.getMaliciousUsers(),
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : eventsData?.events || []);
      setMaliciousUsers(
        Array.isArray(usersData) ? usersData : usersData?.maliciousUsers || []
      );
    } catch (loadError: any) {
      console.error("[SecurityDashboard] Failed to load security data", loadError);
      setError(loadError?.message || "Failed to load security data.");
      setEvents([]);
      setMaliciousUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBlockIp(ipAddress?: string) {
    if (!ipAddress) return;

    Alert.alert("Block IP", `Block ${ipAddress}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            setBlockingIp(ipAddress);
            await SecurityService.blockIp(ipAddress);
            await loadAllData();
          } catch (blockError: any) {
            Alert.alert("Failed", blockError?.message || "Unable to block IP.");
          } finally {
            setBlockingIp(null);
          }
        },
      },
    ]);
  }

  async function handleBlockAllUserIps(email?: string) {
    if (!email) return;

    Alert.alert("Block All IPs", `Block all known IPs for ${email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block All",
        style: "destructive",
        onPress: async () => {
          try {
            setBlockingEmail(email);
            await SecurityService.blockAllUserIps(email);
            await loadAllData();
          } catch (blockError: any) {
            Alert.alert("Failed", blockError?.message || "Unable to block all user IPs.");
          } finally {
            setBlockingEmail(null);
          }
        },
      },
    ]);
  }

  const stats = useMemo(() => {
    const totalEvents = events.length;
    const critical = events.filter(
      (event) => getEventSeverity(event.eventType) === "critical"
    ).length;
    const high = events.filter((event) => getEventSeverity(event.eventType) === "high").length;
    const attackers = maliciousUsers.length;

    return { totalEvents, critical, high, attackers };
  }, [events, maliciousUsers.length]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.centerTitle}>Loading security data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authorized === false) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <View style={styles.lockIconWrap}>
            <Feather name="shield-off" size={24} color="#991B1B" />
          </View>
          <Text style={styles.centerTitle}>Admin access required</Text>
          <Text style={styles.centerCopy}>
            This dashboard is restricted to administrators.
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
      >
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => onNavigate?.("back")}>
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Security Dashboard</Text>
            <Text style={styles.headerSubtitle}>Complete attack monitoring</Text>
          </View>

          <Pressable style={styles.iconButton} onPress={loadAllData}>
            <Feather name="refresh-cw" size={18} color="#0F172A" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <Text style={styles.heroEyebrow}>Threat overview</Text>
          <Text style={styles.heroTitle}>Monitor attacks, actors, and high-risk activity</Text>
          <Text style={styles.heroCopy}>
            Review suspicious events, inspect attacker context, and block IPs before damage spreads.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <MetricCard
            tint="#FEE2E2"
            icon={<Feather name="shield" size={18} color="#B91C1C" />}
            value={String(stats.totalEvents)}
            label="Events"
          />
          <MetricCard
            tint="#FCE7F3"
            icon={<Feather name="alert-octagon" size={18} color="#BE185D" />}
            value={String(stats.critical)}
            label="Critical"
          />
          <MetricCard
            tint="#FEF3C7"
            icon={<Feather name="alert-triangle" size={18} color="#A16207" />}
            value={String(stats.high)}
            label="High Risk"
          />
          <MetricCard
            tint="#E0E7FF"
            icon={<Feather name="users" size={18} color="#4338CA" />}
            value={String(stats.attackers)}
            label="Actors"
          />
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Failed to load security data</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Security Events ({events.length})</Text>
          </View>

          {events.length ? (
            <View style={styles.listWrap}>
              {events.map((event) => {
                const severity = getEventSeverity(event.eventType);
                const severityMeta = getSeverityMeta(severity);
                const ipIsBlocking = blockingIp === event.ipAddress;

                return (
                  <View key={String(event.id)} style={styles.eventCard}>
                    <View style={styles.eventTopRow}>
                      <View style={styles.eventMeta}>
                        <View
                          style={[
                            styles.severityBadge,
                            { backgroundColor: severityMeta.backgroundColor },
                          ]}
                        >
                          <Text style={[styles.severityBadgeText, { color: severityMeta.textColor }]}>
                            {event.eventType || "Unknown Event"}
                          </Text>
                        </View>
                        <Text style={styles.eventTimestamp}>{formatDateTime(event.timestamp)}</Text>
                      </View>
                      <Pressable
                        style={styles.detailsButton}
                        onPress={() => setSelectedEvent(event)}
                      >
                        <Text style={styles.detailsButtonText}>Details</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.eventUser}>{event.userEmail || "unknown"}</Text>
                    <Text style={styles.eventCopy}>
                      {event.userEmail === "unknown" ? "External attacker" : "Registered user"}
                    </Text>

                    <View style={styles.eventInfoGrid}>
                      <InfoPill icon="globe-outline" label={`${event.city || "Unknown"}, ${event.country || "Unknown"}`} />
                      <InfoPill icon="git-network-outline" label={event.ipAddress || "Unknown IP"} />
                      <InfoPill icon="business-outline" label={event.isp || "Unknown ISP"} />
                    </View>

                    <View style={styles.eventActions}>
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => setSelectedEvent(event)}
                      >
                        <Text style={styles.secondaryButtonText}>Inspect</Text>
                      </Pressable>

                      <Pressable
                        style={styles.dangerButton}
                        onPress={() => handleBlockIp(event.ipAddress)}
                        disabled={ipIsBlocking}
                      >
                        {ipIsBlocking ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.dangerButtonText}>Block IP</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyCard
              icon="shield"
              title="No security events"
              copy="No recent attack events were returned by the security service."
            />
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Malicious Users ({maliciousUsers.length})
            </Text>
          </View>

          {maliciousUsers.length ? (
            <View style={styles.userGrid}>
              {maliciousUsers.map((user, index) => {
                const isBlockingAll = blockingEmail === user.email;
                const ipAddresses = Array.from(user.ipAddresses || []);
                return (
                  <View
                    key={`${user.email || "user"}-${index}`}
                    style={[
                      styles.maliciousCard,
                      user.isRegistered ? styles.maliciousCardDanger : styles.maliciousCardWarning,
                    ]}
                  >
                    <View style={styles.maliciousHeader}>
                      <View style={styles.maliciousHeading}>
                        <Text style={styles.maliciousEmail}>{user.email || "Unknown email"}</Text>
                        <Text style={styles.maliciousType}>
                          {user.isRegistered ? "Registered User" : "External Attacker"}
                        </Text>
                      </View>
                      <View style={styles.riskBadge}>
                        <Text style={styles.riskBadgeText}>{user.riskLevel || 0}/10 Risk</Text>
                      </View>
                    </View>

                    {user.isRegistered ? (
                      <View style={styles.maliciousInfoBlock}>
                        <Text style={styles.maliciousInfoText}>
                          <Text style={styles.maliciousInfoLabel}>Name: </Text>
                          {user.userName || "N/A"}
                        </Text>
                        <Text style={styles.maliciousInfoText}>
                          <Text style={styles.maliciousInfoLabel}>Role: </Text>
                          {user.userRole || "N/A"}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.metricsRow}>
                      <SmallMetric value={String(user.eventCount || 0)} label="Events" />
                      <SmallMetric value={String(user.ipCount || 0)} label="IPs Used" />
                    </View>

                    <View style={styles.ipGroup}>
                      <Text style={styles.ipGroupTitle}>IP Addresses</Text>
                      <View style={styles.ipWrap}>
                        {ipAddresses.map((ip, ipIndex) => (
                          <View key={`${ip}-${ipIndex}`} style={styles.ipPill}>
                            <Text style={styles.ipPillText}>{ip}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <Pressable
                      style={styles.blockAllButton}
                      onPress={() => handleBlockAllUserIps(user.email)}
                      disabled={isBlockingAll}
                    >
                      {isBlockingAll ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <Text style={styles.blockAllButtonText}>Block All IPs</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyCard
              icon="check-circle"
              title="No malicious users detected"
              copy="The current security summary does not flag any malicious users."
            />
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={!!selectedEvent}
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Attack Details</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedEvent?.eventType || "Security event"}
                </Text>
              </View>
              <Pressable
                style={styles.modalClose}
                onPress={() => setSelectedEvent(null)}
              >
                <Feather name="x" size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Attack Information</Text>
                <ModalLine label="Type" value={selectedEvent?.eventType || "N/A"} />
                <ModalLine label="Time" value={formatDateTime(selectedEvent?.timestamp)} />
                <ModalLine label="Description" value={selectedEvent?.description || "N/A"} />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Attacker Identity</Text>
                <ModalLine label="Email" value={selectedEvent?.userEmail || "unknown"} />
                <ModalLine label="IP Address" value={selectedEvent?.ipAddress || "N/A"} />
                <ModalLine
                  label="Location"
                  value={`${selectedEvent?.city || "Unknown"}, ${
                    selectedEvent?.country || "Unknown"
                  }`}
                />
                <ModalLine label="ISP" value={selectedEvent?.isp || "Unknown"} />
              </View>

              <View style={styles.contextCard}>
                <Text style={styles.modalSectionTitle}>Full Context</Text>
                <Text style={styles.contextText}>
                  {selectedEvent?.description || "No additional context was returned."}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MetricCard({
  tint,
  icon,
  value,
  label,
}: {
  tint: string;
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: tint }]}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SmallMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.smallMetric}>
      <Text style={styles.smallMetricValue}>{value}</Text>
      <Text style={styles.smallMetricLabel}>{label}</Text>
    </View>
  );
}

function InfoPill({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={13} color="#334155" />
      <Text style={styles.infoPillText}>{label}</Text>
    </View>
  );
}

function EmptyCard({
  icon,
  title,
  copy,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  copy: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <Feather name={icon} size={22} color="#0F766E" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

function ModalLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.modalLine}>
      <Text style={styles.modalLineLabel}>{label}</Text>
      <Text style={styles.modalLineValue}>{value}</Text>
    </View>
  );
}

function formatDateTime(timestamp?: string) {
  if (!timestamp) return "N/A";
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
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
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginTop: 8,
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
    top: -30,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(239, 68, 68, 0.16)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -44,
    left: -24,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#FCA5A5",
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: "47.8%",
    borderRadius: 24,
    padding: 16,
  },
  metricIcon: {
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  errorCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FEE2E2",
  },
  errorTitle: {
    fontSize: 17,
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
  listWrap: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  eventTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  eventMeta: {
    flex: 1,
    gap: 8,
  },
  severityBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  eventTimestamp: {
    fontSize: 12,
    color: "#64748B",
  },
  detailsButton: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#E2E8F0",
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  eventUser: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  eventCopy: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  eventInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#E2E8F0",
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  eventActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#E2E8F0",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  dangerButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#DC2626",
  },
  dangerButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userGrid: {
    gap: 12,
  },
  maliciousCard: {
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
  },
  maliciousCardDanger: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
  },
  maliciousCardWarning: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  maliciousHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  maliciousHeading: {
    flex: 1,
    gap: 4,
  },
  maliciousEmail: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  maliciousType: {
    fontSize: 12,
    color: "#64748B",
  },
  riskBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#111827",
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  maliciousInfoBlock: {
    marginTop: 12,
    gap: 4,
  },
  maliciousInfoText: {
    fontSize: 13,
    color: "#475569",
  },
  maliciousInfoLabel: {
    fontWeight: "800",
    color: "#0F172A",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  smallMetric: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.56)",
    alignItems: "center",
  },
  smallMetricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  smallMetricLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  ipGroup: {
    marginTop: 14,
  },
  ipGroupTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  ipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ipPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ipPillText: {
    fontSize: 12,
    color: "#334155",
  },
  blockAllButton: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#FBBF24",
  },
  blockAllButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  modalCard: {
    maxHeight: "86%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#111827",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  modalTitleWrap: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 14,
  },
  modalSection: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#1F2937",
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  modalLine: {
    marginBottom: 10,
  },
  modalLineLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  modalLineValue: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#E5E7EB",
  },
  contextCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#1F2937",
    marginBottom: 8,
  },
  contextText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#CBD5E1",
  },
});
