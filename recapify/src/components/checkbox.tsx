import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type AppCheckboxProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
};

export const AppCheckbox = ({
  label,
  checked,
  disabled = false,
  onValueChange,
}: AppCheckboxProps) => {
  const { colors, iconSizes, spacing, radius, typography } = useThemeTokens();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!checked)}
      style={({ pressed }) => [
        styles.row,
        {
          opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
          gap: spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? colors.primary : colors.surface,
            borderColor: checked ? colors.primary : colors.border,
            borderRadius: radius.xs,
            height: iconSizes.lg,
            width: iconSizes.lg,
          },
        ]}
      >
        {checked ? (
          <Ionicons color={colors.textInverse} name="checkmark" size={iconSizes.md} />
        ) : null}
      </View>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.secondary.lg,
          fontWeight: typography.weights.medium,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  box: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
});
