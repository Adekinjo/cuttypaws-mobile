import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
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

import Footer from "../../components/common/Footer";
import keyValueStorage from "../../utils/keyValueStorage";

const LOCATION_CACHE_KEY = "my_city_zipcode";
const LOCATION_TIME_KEY = "my_location_time";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

type CachedLocation = {
  city: string;
  zipcode: string;
  country?: string;
  region?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
};

export default function LocationPage({
  onNavigate,
}: {
  onNavigate?: (route: string) => void;
}) {
  const [locationData, setLocationData] = useState<CachedLocation | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState<"live" | "cache" | "none">("none");

  const getCachedLocation = useCallback(async () => {
    try {
      const savedData = await keyValueStorage.getItem(LOCATION_CACHE_KEY);
      const savedTime = await keyValueStorage.getItem(LOCATION_TIME_KEY);

      if (!savedData || !savedTime) return null;

      const now = Date.now();
      const savedTimeNumber = Number(savedTime);
      if (!Number.isFinite(savedTimeNumber)) return null;

      if (now - savedTimeNumber < CACHE_DURATION) {
        return JSON.parse(savedData) as CachedLocation;
      }

      await keyValueStorage.removeItem(LOCATION_CACHE_KEY);
      await keyValueStorage.removeItem(LOCATION_TIME_KEY);
      return null;
    } catch (cacheError) {
      console.warn("[LocationPage] Failed to read location cache", cacheError);
      return null;
    }
  }, []);

  const saveLocationToCache = useCallback(async (payload: CachedLocation) => {
    try {
      await keyValueStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
      await keyValueStorage.setItem(LOCATION_TIME_KEY, String(Date.now()));
    } catch (cacheError) {
      console.warn("[LocationPage] Could not save location to cache", cacheError);
    }
  }, []);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const address = results?.[0];
      const city =
        address?.city ||
        address?.district ||
        address?.subregion ||
        address?.region ||
        "";
      const zipcode = address?.postalCode || "";

      if (!city && !zipcode) {
        throw new Error("Unable to determine city or zip code from your current location.");
      }

      const normalizedLocation: CachedLocation = {
        city,
        zipcode,
        country: address?.country || "",
        region: address?.region || "",
        district: address?.district || address?.subregion || "",
        latitude,
        longitude,
      };

      setLocationData(normalizedLocation);
      setSource("live");
      await saveLocationToCache(normalizedLocation);
    },
    [saveLocationToCache]
  );

  const loadLocation = useCallback(
    async ({ forceRefresh = false }: { forceRefresh?: boolean } = {}) => {
      try {
        if (forceRefresh) {
          setRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError("");

        if (!forceRefresh) {
          const cachedLocation = await getCachedLocation();
          if (cachedLocation) {
            setLocationData(cachedLocation);
            setSource("cache");
            setIsLoading(false);
            return;
          }
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          throw new Error("Location access denied or unavailable.");
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await reverseGeocode(
          currentPosition.coords.latitude,
          currentPosition.coords.longitude
        );
      } catch (locationError: any) {
        console.error("[LocationPage] Failed to resolve location", locationError);

        const cachedLocation = await getCachedLocation();
        if (cachedLocation) {
          setLocationData(cachedLocation);
          setSource("cache");
          setError(
            locationError?.message ||
              "Live location is unavailable. Showing your most recent saved location."
          );
        } else {
          setLocationData(null);
          setSource("none");
          setError(locationError?.message || "Unable to retrieve your current location.");
        }
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [getCachedLocation, reverseGeocode]
  );

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  const heroSubtitle = useMemo(() => {
    if (source === "cache") {
      return "Showing your saved location snapshot for a faster return experience.";
    }

    if (source === "live") {
      return "Your city and zip code were resolved from the device location in real time.";
    }

    return "Allow location access to detect the nearest city and postal area for personalized flows.";
  }, [source]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadLocation({ forceRefresh: true })}
            tintColor="#0F766E"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#0F172A" />
              <Text style={styles.heroBadgeText}>Your location</Text>
            </View>

            <Pressable
              style={styles.refreshPill}
              onPress={() => loadLocation({ forceRefresh: true })}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#DBEAFE" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={14} color="#DBEAFE" />
                  <Text style={styles.refreshPillText}>Refresh</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>Location, simplified</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>

          <View style={styles.heroFeatureRow}>
            <FeatureChip label="24h cache" />
            <FeatureChip label="Reverse geocode" />
            <FeatureChip label="Mobile ready" />
          </View>
        </View>

        {error ? (
          <View style={styles.bannerError}>
            <Feather name="alert-circle" size={16} color="#B91C1C" />
            <Text style={styles.bannerErrorText}>{error}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.stateTitle}>Checking your location</Text>
            <Text style={styles.stateBody}>
              We are requesting location permission and resolving your city details.
            </Text>
          </View>
        ) : null}

        {!isLoading && locationData ? (
          <>
            <View style={styles.primaryCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationIconWrap}>
                  <Ionicons name="location" size={26} color="#0F766E" />
                </View>

                <View style={styles.locationTextBlock}>
                  <Text style={styles.locationTitle}>
                    {[locationData.city, locationData.zipcode].filter(Boolean).join(" ")}
                  </Text>
                  <Text style={styles.locationSubtitle}>
                    {[locationData.district, locationData.region, locationData.country]
                      .filter(Boolean)
                      .join(", ") || "Current detected area"}
                  </Text>
                </View>
              </View>

              <View style={styles.locationGrid}>
                <InfoTile
                  label="City"
                  value={locationData.city || "Unavailable"}
                  icon="map-pin"
                />
                <InfoTile
                  label="Zip code"
                  value={locationData.zipcode || "Unavailable"}
                  icon="hash"
                />
                <InfoTile
                  label="Region"
                  value={locationData.region || "Unavailable"}
                  icon="navigation"
                />
                <InfoTile
                  label="Country"
                  value={locationData.country || "Unavailable"}
                  icon="globe"
                />
              </View>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.sectionTitle}>Why this matters</Text>
              <View style={styles.insightList}>
                <InsightRow text="Use location-aware flows for shipping, search, and personalized service suggestions." />
                <InsightRow text="Cached results reduce repeated permission prompts and improve load speed on return visits." />
                <InsightRow text="Manual refresh lets users update stale location data when they travel." />
              </View>
            </View>
          </>
        ) : null}

        {!isLoading && !locationData ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="map-marker-question-outline" size={28} color="#0F766E" />
            </View>
            <Text style={styles.stateTitle}>Location unavailable</Text>
            <Text style={styles.stateBody}>
              Enable foreground location access and pull to refresh to fetch your city and zip code.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => loadLocation({ forceRefresh: true })}
            >
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}

        <Footer onNavigate={onNavigate} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureChip({ label }: { label: string }) {
  return (
    <View style={styles.featureChip}>
      <Text style={styles.featureChipText}>{label}</Text>
    </View>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.infoTile}>
      <View style={styles.infoTileIconWrap}>
        <Feather name={icon} size={16} color="#0F766E" />
      </View>
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue}>{value}</Text>
    </View>
  );
}

function InsightRow({ text }: { text: string }) {
  return (
    <View style={styles.insightRow}>
      <View style={styles.insightDot} />
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4FBF8",
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
    backgroundColor: "#F4FBF8",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 22,
    gap: 16,
    backgroundColor: "#0F172A",
  },
  heroGlowOne: {
    position: "absolute",
    top: -36,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  heroGlowTwo: {
    position: "absolute",
    bottom: -44,
    left: -24,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.14)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#CCFBF1",
  },
  heroBadgeText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  refreshPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(219,234,254,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  refreshPillText: {
    color: "#DBEAFE",
    fontWeight: "800",
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: "#C8D4E3",
    lineHeight: 22,
    fontSize: 15,
  },
  heroFeatureRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  featureChipText: {
    color: "#E2E8F0",
    fontWeight: "800",
    fontSize: 12,
  },
  bannerError: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  bannerErrorText: {
    flex: 1,
    color: "#991B1B",
    lineHeight: 20,
    fontWeight: "600",
  },
  stateCard: {
    alignItems: "center",
    gap: 12,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  emptyIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  stateTitle: {
    color: "#102A43",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  stateBody: {
    color: "#486581",
    lineHeight: 22,
    textAlign: "center",
  },
  primaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: "#DDE7EE",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  locationIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
  },
  locationTextBlock: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    color: "#102A43",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  locationSubtitle: {
    color: "#64748B",
    lineHeight: 20,
  },
  locationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoTile: {
    width: "47%",
    minWidth: 148,
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  infoTileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CCFBF1",
  },
  infoTileLabel: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  infoTileValue: {
    color: "#102A43",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  insightCard: {
    backgroundColor: "#0F766E",
    borderRadius: 26,
    padding: 20,
    gap: 14,
  },
  sectionTitle: {
    color: "#ECFEFF",
    fontSize: 22,
    fontWeight: "900",
  },
  insightList: {
    gap: 12,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  insightDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: "#99F6E4",
  },
  insightText: {
    flex: 1,
    color: "#CCFBF1",
    lineHeight: 21,
  },
  primaryButton: {
    minWidth: 160,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F766E",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
