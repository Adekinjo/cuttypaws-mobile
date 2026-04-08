import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingSpinner({
  label = "Loading...",
  subtitle,
  fullScreen = false,
}: {
  label?: string;
  subtitle?: string;
  fullScreen?: boolean;
}) {
  return (
    <View style={[styles.wrapper, fullScreen && styles.wrapperFullScreen]}>
      <View style={styles.card}>
        <View style={styles.ring}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
        <Text style={styles.label}>{label}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  wrapperFullScreen: {
    flex: 1,
    minHeight: 0,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#102A43",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
