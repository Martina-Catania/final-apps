import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button, FormCard, InlineErrorText, type ButtonVariant } from "../components";
import { useThemeTokens } from "../hooks";
import { SafeAreaPage } from "./safe-area-page";

type IconName = ComponentProps<typeof Ionicons>["name"];

type EditPageAction = {
  label: string;
  iconName?: IconName;
  onPress: () => void;
  variant?: ButtonVariant;
};

type EditPageStateProps = {
  children: ReactNode;
  backgroundColor: string;
  errorTitle: string;
  actions: EditPageAction[];
  isLoading: boolean;
  loadError: string | null;
};

export function EditPageState({
  children,
  backgroundColor,
  errorTitle,
  actions,
  isLoading,
  loadError,
}: EditPageStateProps) {
  const { colors, spacing, typography, radius } = useThemeTokens();

  if (isLoading) {
    return (
      <SafeAreaPage backgroundColor={backgroundColor}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaPage>
    );
  }

  if (loadError) {
    return (
      <SafeAreaPage backgroundColor={backgroundColor}>
        <FormCard
          style={{
            borderRadius: radius.md,
            gap: spacing.md,
            margin: spacing.lg,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.md,
              fontWeight: typography.weights.bold,
            }}
          >
            {errorTitle}
          </Text>

          <InlineErrorText message={loadError} size="md" />

          <View style={{ gap: spacing.sm }}>
            {actions.map((action) => (
              <Button
                fullWidth
                iconName={action.iconName}
                key={`edit-page-state-action-${action.label}`}
                label={action.label}
                onPress={action.onPress}
                variant={action.variant ?? "default"}
              />
            ))}
          </View>
        </FormCard>
      </SafeAreaPage>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
