import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { Button, type ButtonVariant } from "./Button";

type IconName = ComponentProps<typeof Ionicons>["name"];

type FormActionsProps = {
  disabled?: boolean;
  isPrimaryLoading?: boolean;
  primaryLabel: string;
  primaryLoadingLabel?: string;
  primaryIconName?: IconName;
  primaryVariant?: Exclude<ButtonVariant, "icon" | "disabled">;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  secondaryIconName?: IconName;
  secondaryVariant?: Exclude<ButtonVariant, "icon" | "disabled">;
  onSecondaryPress?: () => void;
};

export const FormActions = ({
  disabled = false,
  isPrimaryLoading = false,
  primaryLabel,
  primaryLoadingLabel,
  primaryIconName,
  primaryVariant = "primary",
  onPrimaryPress,
  secondaryLabel,
  secondaryIconName,
  secondaryVariant = "default",
  onSecondaryPress,
}: FormActionsProps) => {
  const { spacing } = useThemeTokens();
  const shouldShowSecondary = Boolean(secondaryLabel && onSecondaryPress);

  return (
    <View style={[styles.rowWrap, { gap: spacing.sm }]}> 
      <Button
        disabled={disabled}
        fullWidth
        iconName={primaryIconName}
        label={isPrimaryLoading && primaryLoadingLabel ? primaryLoadingLabel : primaryLabel}
        onPress={onPrimaryPress}
        variant={primaryVariant}
      />

      {shouldShowSecondary ? (
        <Button
          disabled={disabled}
          fullWidth
          iconName={secondaryIconName}
          label={secondaryLabel}
          onPress={onSecondaryPress}
          variant={secondaryVariant}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
