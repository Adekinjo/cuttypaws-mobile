import { Feather } from "@expo/vector-icons";
import { Bone, Cookie, Heart, PawPrint } from "lucide-react-native";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LikesService from "../../api/LikesService";
import { useTheme } from "../context/ThemeContext";

type ReactionType = keyof typeof LikesService.ReactionType;

type ReactionPickerProps = {
  postId?: string;
  currentReaction?: ReactionType | null;
  onReactionSelect?: (reaction: ReactionType) => void | Promise<void>;
  onRemoveReaction?: () => void | Promise<void>;
  onReactionChange?: (reaction: ReactionType | null) => void;
  size?: number;
  disabled?: boolean;
};

const REACTIONS: {
  type: ReactionType;
  label: string;
  color: string;
  bg: string;
  renderIcon: (props: { color: string; filled: boolean }) => ReactNode;
}[] = [
  {
    type: "PAWPRINT",
    label: "Pawprint",
    color: "#F97316",
    bg: "rgba(249, 115, 22, 0.14)",
    renderIcon: ({ color, filled }) => (
      <PawPrint size={20} strokeWidth={2.3} color={color} fill={filled ? color : "none"} />
    ),
  },
  {
    type: "COOKIE",
    label: "Cookie",
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.14)",
    renderIcon: ({ color, filled }) => (
      <Cookie size={20} strokeWidth={2.3} color={color} fill={filled ? color : "none"} />
    ),
  },
  {
    type: "BONE",
    label: "Bone",
    color: "#0F766E",
    bg: "rgba(15, 118, 110, 0.14)",
    renderIcon: ({ color, filled }) => (
      <Bone size={20} strokeWidth={2.3} color={color} fill={filled ? color : "none"} />
    ),
  },
  {
    type: "HEART",
    label: "Heart",
    color: "#E11D48",
    bg: "rgba(225, 29, 72, 0.14)",
    renderIcon: ({ color, filled }) => (
      <Heart size={20} strokeWidth={2.3} color={color} fill={filled ? color : "none"} />
    ),
  },
];

export default function ReactionsPicker({
  postId,
  currentReaction,
  onReactionSelect,
  onRemoveReaction,
  onReactionChange,
  size = 24,
  disabled = false,
}: ReactionPickerProps) {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localReaction, setLocalReaction] = useState<ReactionType | null>(currentReaction ?? null);
  const [error, setError] = useState("");

  const reveal = useRef(new Animated.Value(0)).current;
  const triggerScale = useRef(new Animated.Value(1)).current;
  const shakeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLocalReaction(currentReaction ?? null);
  }, [currentReaction]);

  useEffect(() => {
    Animated.spring(triggerScale, {
      toValue: localReaction ? 1.06 : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [localReaction, triggerScale]);

  const runShake = () => {
    shakeValue.setValue(0);
    Animated.sequence([
      Animated.timing(shakeValue, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(shakeValue, {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 150,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal, visible]);

  const currentReactionData = useMemo(
    () => REACTIONS.find((item) => item.type === localReaction) || null,
    [localReaction]
  );

  const handleTriggerPress = () => {
    if (disabled || loading) return;

    setVisible((prev) => !prev);
  };

  const handleRemoveReaction = async () => {
    if (disabled || loading) return;

    const previous = localReaction;
    setLoading(true);
    setError("");

    try {
      setLocalReaction(null);
      onReactionChange?.(null);

      if (onRemoveReaction) {
        await onRemoveReaction();
      } else if (postId) {
        await LikesService.removeReaction(postId);
      }
    } catch (removeError: any) {
      setLocalReaction(previous);
      onReactionChange?.(previous);
      setError(removeError?.message || "Failed to remove reaction.");
    } finally {
      setVisible(false);
      setLoading(false);
    }
  };

  const handleReactionPress = async (reaction: ReactionType) => {
    if (disabled || loading) return;

    const previous = localReaction;
    runShake();
    setLoading(true);
    setError("");
    setLocalReaction(reaction);
    onReactionChange?.(reaction);

    try {
      if (previous === reaction) {
        if (onRemoveReaction) {
          await onRemoveReaction();
        } else if (postId) {
          await LikesService.removeReaction(postId);
        }
        setLocalReaction(null);
        onReactionChange?.(null);
      } else if (onReactionSelect) {
        await onReactionSelect(reaction);
      } else if (postId) {
        await LikesService.reactToPost(postId, reaction);
      }
    } catch (reactionError: any) {
      setLocalReaction(previous);
      onReactionChange?.(previous);
      setError(reactionError?.message || "Failed to update reaction.");
    } finally {
      setVisible(false);
      setLoading(false);
    }
  };

  const pickerAnimatedStyle = {
    opacity: reveal,
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
      {
        scale: reveal.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };

  const shakeTransform = [
    {
      translateX: shakeValue.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: [0, -4, 4, -3, 2, 0],
      }),
    },
    {
      rotate: shakeValue.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: ["0deg", "-10deg", "10deg", "-8deg", "6deg", "0deg"],
      }),
    },
  ];

  return (
    <View style={styles.wrapper}>
      {visible ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
      ) : null}

      <Animated.View style={{ transform: [{ scale: triggerScale }] }}>
        <Pressable
          onPress={handleTriggerPress}
          style={[
            styles.trigger,
            {
              width: size + 20,
              height: size + 20,
              borderRadius: (size + 20) / 2,
            },
            currentReactionData && {
              backgroundColor: currentReactionData.bg,
              borderColor: currentReactionData.color,
            },
            !currentReactionData && {
              backgroundColor: isDark ? colors.backgroundMuted : "#FFFFFF",
              borderColor: isDark ? colors.border : "#E2E8F0",
            },
            disabled && styles.disabled,
          ]}
        >
          {loading ? (
            <Feather name="loader" size={size - 4} color={colors.textMuted} />
          ) : (
            <Animated.View style={currentReactionData ? { transform: shakeTransform } : undefined}>
              {currentReactionData ? (
                currentReactionData.renderIcon({
                  color: currentReactionData.color,
                  filled: true,
                })
              ) : (
                <PawPrint size={size - 1} strokeWidth={2.3} color={colors.textMuted} />
              )}
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>

      {visible ? (
        <Animated.View
          style={[
            styles.pickerPopup,
            pickerAnimatedStyle,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.arrow, { borderTopColor: colors.card }]} />
          <View style={styles.reactionRow}>
            {REACTIONS.map((reaction) => {
              const isActive = localReaction === reaction.type;
              return (
                <Animated.View
                  key={reaction.type}
                  style={isActive ? { transform: shakeTransform } : undefined}
                >
                  <Pressable
                    style={[
                      styles.reactionButton,
                      isActive && { backgroundColor: reaction.bg },
                    ]}
                    onPress={() => handleReactionPress(reaction.type)}
                    hitSlop={8}
                  >
                    {reaction.renderIcon({
                      color: reaction.color,
                      filled: isActive,
                    })}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {localReaction ? (
            <Pressable style={styles.removeRow} onPress={handleRemoveReaction}>
              <Feather name="trash-2" size={15} color="#991B1B" />
              <Text style={[styles.removeText, { color: colors.danger }]}>
                Remove current reaction
              </Text>
            </Pressable>
          ) : (
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Tap a reaction to send it instantly.
            </Text>
          )}

          {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignSelf: "flex-start",
  },
  trigger: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  disabled: {
    opacity: 0.45,
  },
  pickerPopup: {
    position: "absolute",
    bottom: 48,
    left: 0,
    minWidth: 216,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#020617",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    zIndex: 20,
  },
  arrow: {
    position: "absolute",
    bottom: -8,
    left: 18,
    width: 16,
    height: 16,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    transform: [{ rotate: "45deg" }],
  },
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  reactionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
    position: "relative",
  },
  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
  },
  removeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
  },
  helperText: {
    marginTop: 14,
    fontSize: 12,
    textAlign: "center",
    color: "#64748B",
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    textAlign: "center",
    color: "#B91C1C",
  },
});
