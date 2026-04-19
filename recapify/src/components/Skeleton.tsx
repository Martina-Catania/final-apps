import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "../hooks";

type SkeletonBlockProps = {
  width: number | `${number}%` | "auto";
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonBlock = ({
  width,
  height,
  borderRadius = 10,
  style,
}: SkeletonBlockProps) => {
  const { colors } = useThemeTokens();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius,
          height,
          opacity,
          width,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard = () => {
  const { spacing } = useThemeTokens();

  return (
    <View style={[styles.card, { gap: spacing.sm, padding: spacing.md }]}> 
      <SkeletonBlock height={20} width="65%" />
      <SkeletonBlock height={14} width="100%" />
      <SkeletonBlock height={14} width="88%" />
      <SkeletonBlock height={14} width="78%" />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
  },
});
