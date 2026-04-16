import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useThemeTokens } from "../hooks";

type IconName = ComponentProps<typeof Ionicons>["name"];

type AppTextInputProps = Omit<TextInputProps, "style"> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
};

export const AppTextInput = ({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...rest
}: AppTextInputProps) => {
  const { colors, iconSizes, radius, spacing, typography } = useThemeTokens();
  const hasError = Boolean(errorText);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.secondary.md,
            fontWeight: typography.weights.semibold,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: hasError ? colors.danger : colors.border,
            borderRadius: radius.sm,
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        {leftIcon ? (
          <Ionicons color={colors.textSecondary} name={leftIcon} size={iconSizes.md} />
        ) : null}

        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={{
            color: colors.textPrimary,
            flex: 1,
            fontSize: typography.secondary.lg,
          }}
          underlineColorAndroid="transparent"
          {...rest}
        />

        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={onRightIconPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
          >
            <Ionicons color={colors.textSecondary} name={rightIcon} size={iconSizes.md} />
          </Pressable>
        ) : null}
      </View>

      {errorText ? (
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.secondary.sm,
          }}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.sm,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
  },
});
