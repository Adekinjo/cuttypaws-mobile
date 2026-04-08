import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";

export function AdminScreen({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!!subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </View>
        {action}
      </View>
      {children}
    </ScrollView>
  );
}

export function AdminCard({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.06,
          elevation: isDark ? 0 : 2,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function AdminButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: colors.success },
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        variant === "secondary" && { backgroundColor: colors.border },
        variant === "danger" && { backgroundColor: colors.danger },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Banner({
  message,
  tone = "info",
}: {
  message?: string;
  tone?: "info" | "success" | "error";
}) {
  const { colors, isDark } = useTheme();
  if (!message) return null;
  return (
    <View
      style={[
        styles.banner,
        tone === "success" && styles.bannerSuccess,
        tone === "error" && styles.bannerError,
        tone === "info" && { backgroundColor: isDark ? colors.backgroundMuted : "#E3F2FD" },
        tone === "success" && { backgroundColor: isDark ? "rgba(49,196,141,0.14)" : "#E8F5E9" },
        tone === "error" && { backgroundColor: isDark ? "rgba(248,113,113,0.14)" : "#FDECEC" },
      ]}
    >
      <Text style={[styles.bannerText, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { borderColor: colors.border, backgroundColor: colors.backgroundElevated, color: colors.text },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.centerState}>
      <ActivityIndicator />
      <Text style={[styles.stateText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.centerState}>
      <Text style={[styles.stateText, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export function Row({ label, value }: { label: string; value?: string | number | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value ?? "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
    gap: 16,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#102A43",
  },
  subtitle: {
    color: "#486581",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  button: {
    backgroundColor: "#1F9D72",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "#D9E2EC",
  },
  buttonDanger: {
    backgroundColor: "#D64545",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  banner: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 12,
  },
  bannerSuccess: {
    backgroundColor: "#E8F5E9",
  },
  bannerError: {
    backgroundColor: "#FDECEC",
  },
  bannerText: {
    color: "#102A43",
  },
  field: {
    gap: 6,
  },
  label: {
    fontWeight: "700",
    color: "#243B53",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  centerState: {
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  stateText: {
    color: "#486581",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: {
    color: "#486581",
    fontWeight: "600",
    flex: 1,
  },
  rowValue: {
    color: "#102A43",
    flex: 1,
    textAlign: "right",
  },
});

export const adminStyles = styles;
