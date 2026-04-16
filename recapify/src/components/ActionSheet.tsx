import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ActionSheet, { type ActionSheetRef } from "react-native-actions-sheet";

import { useThemeTokens } from "../hooks";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ActionSheetItem<TValue extends string = string> = {
  label: string;
  value: TValue;
  iconName?: IconName;
  destructive?: boolean;
  disabled?: boolean;
};

type AppActionSheetProps<TValue extends string = string> = {
  title?: string;
  items: readonly ActionSheetItem<TValue>[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: TValue) => void;
};

export const AppActionSheet = <TValue extends string = string>({
  title = "Choose an action",
  items,
  isOpen,
  onClose,
  onSelect,
}: AppActionSheetProps<TValue>) => {
  const ref = useRef<ActionSheetRef>(null);
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  useEffect(() => {
    if (isOpen) {
      ref.current?.show();
    } else {
      ref.current?.hide();
    }
  }, [isOpen]);

  return (
    <ActionSheet
      animated
      closeOnTouchBackdrop
      containerStyle={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
      }}
      gestureEnabled
      indicatorStyle={{
        backgroundColor: colors.border,
        width: 70,
      }}
      onClose={onClose}
      overlayColor={colors.overlay}
      ref={ref}
    >
      <View style={[styles.content, { gap: spacing.md, padding: spacing.lg }]}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.primary.md,
            fontWeight: typography.weights.bold,
          }}
        >
          {title}
        </Text>

        {items.map((item) => {
          const color = item.destructive ? colors.danger : colors.textPrimary;

          return (
            <Pressable
              accessibilityRole="button"
              disabled={item.disabled}
              key={item.value}
              onPress={() => {
                if (item.disabled) {
                  return;
                }

                onSelect(item.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  gap: spacing.md,
                  opacity: item.disabled ? 0.45 : pressed ? 0.78 : 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                },
              ]}
            >
              {item.iconName ? (
                <Ionicons color={color} name={item.iconName} size={iconSizes.md} />
              ) : null}
              <Text
                style={{
                  color,
                  fontSize: typography.secondary.lg,
                  fontWeight: typography.weights.medium,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ActionSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  row: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
  },
});
