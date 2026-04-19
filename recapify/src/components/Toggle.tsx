import { Switch, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type AppToggleProps = {
  label: string;
  value: boolean;
  description?: string;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
};

export const AppToggle = ({
  label,
  value,
  description,
  disabled = false,
  onValueChange,
}: AppToggleProps) => {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          gap: spacing.xs,
          padding: spacing.md,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.textArea, { gap: spacing.xxs }]}> 
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.semibold,
            }}
          >
            {label}
          </Text>
          {description ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.sm,
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>
        <Switch
          disabled={disabled}
          ios_backgroundColor={colors.surfaceMuted}
          onValueChange={onValueChange}
          thumbColor={value ? colors.primary : colors.surface}
          trackColor={{
            false: colors.border,
            true: colors.secondary,
          }}
          value={value}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textArea: {
    flex: 1,
    paddingRight: 12,
  },
});
