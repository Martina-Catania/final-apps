import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { Button, type ButtonVariant } from "./Button";

type IconName = ComponentProps<typeof Ionicons>["name"];

type SectionHeaderProps = {
  label: string;
  actionLabel?: string;
  actionIconName?: IconName;
  actionVariant?: Exclude<ButtonVariant, "icon" | "disabled">;
  onActionPress?: () => void;
};

export const SectionHeader = ({
  label,
  actionLabel,
  actionIconName,
  actionVariant = "secondary",
  onActionPress,
}: SectionHeaderProps) => {
  const { colors, spacing, typography } = useThemeTokens();
  const shouldShowAction = Boolean(actionLabel && onActionPress);

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.primary.sm,
          fontWeight: typography.weights.semibold,
        }}
      >
        {label}
      </Text>

      {shouldShowAction ? (
        <Button
          iconName={actionIconName}
          label={actionLabel}
          onPress={onActionPress}
          variant={actionVariant}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
