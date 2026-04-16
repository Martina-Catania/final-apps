import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import { Pressable, type PressableProps, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type ButtonVariant = "primary" | "secondary" | "default" | "disabled";

type AppButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  iconName?: IconName;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export const AppButton = ({
  label,
  iconName,
  variant = "default",
  fullWidth = false,
  disabled,
  ...rest
}: AppButtonProps) => {
  const { colors, typography, spacing, radius, iconSizes } = useThemeTokens();

  const isDisabled = disabled || variant === "disabled";

  const getContainerColors = () => {
    if (isDisabled) {
      return {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
      };
    }

    if (variant === "primary") {
      return {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      };
    }

    if (variant === "secondary") {
      return {
        backgroundColor: colors.secondaryMuted,
        borderColor: colors.secondary,
      };
    }

    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    };
  };

  const getTextColor = () => {
    if (isDisabled) {
      return colors.textSecondary;
    }

    if (variant === "primary") {
      return colors.textInverse;
    }

    return colors.textPrimary;
  };

  const textColor = getTextColor();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      hitSlop={6}
      pressRetentionOffset={10}
      style={({ pressed }) => [
        styles.container,
        {
          ...getContainerColors(),
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          opacity: pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
      {...rest}
    >
      <View style={[styles.content, { gap: spacing.sm }]}>
        {iconName ? (
          <Ionicons color={textColor} name={iconName} size={iconSizes.md} />
        ) : null}
        <Text
          style={{
            color: textColor,
            fontSize: typography.secondary.lg,
            fontWeight: typography.weights.semibold,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});
