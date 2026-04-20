import { StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { Button } from "./Button";

type FormHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  backAccessibilityLabel?: string;
};

export const FormHeader = ({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel = "Back",
}: FormHeaderProps) => {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Button
        accessibilityLabel={backAccessibilityLabel}
        iconName="arrow-back-outline"
        onPress={onBack}
        variant="icon"
      />

      <View style={[styles.textContainer, { gap: spacing.xs }]}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.primary.md,
            fontWeight: typography.weights.bold,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  textContainer: {
    flex: 1,
  },
});
