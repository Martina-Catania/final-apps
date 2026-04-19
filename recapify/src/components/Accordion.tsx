import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { useThemeTokens } from "../hooks";

if (
  Platform.OS === "android" &&
  typeof UIManager.setLayoutAnimationEnabledExperimental === "function"
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AccordionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
};

export const Accordion = ({
  title,
  children,
  defaultExpanded = false,
}: AccordionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((current) => !current);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={toggle}
        style={({ pressed }) => [
          styles.header,
          {
            opacity: pressed ? 0.8 : 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <Text
          style={{
            color: colors.textPrimary,
            flex: 1,
            fontSize: typography.secondary.lg,
            fontWeight: typography.weights.semibold,
          }}
        >
          {title}
        </Text>
        <Ionicons
          color={colors.textSecondary}
          name={expanded ? "chevron-up" : "chevron-down"}
          size={iconSizes.md}
        />
      </Pressable>

      {expanded ? (
        <View
          style={{
            borderTopColor: colors.border,
            borderTopWidth: 1,
            padding: spacing.md,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
});
