import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { Button, type ButtonVariant } from "./Button";

type ModalAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
};

type AppModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ModalAction[];
  onClose: () => void;
};

export const AppModal = ({
  visible,
  title,
  description,
  children,
  actions,
  onClose,
}: AppModalProps) => {
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        />

        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              gap: spacing.md,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text
              style={{
                color: colors.textPrimary,
                flex: 1,
                fontSize: typography.primary.md,
                fontWeight: typography.weights.bold,
              }}
            >
              {title}
            </Text>
            <Pressable
              accessibilityLabel="Close modal"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons color={colors.textSecondary} name="close" size={iconSizes.lg} />
            </Pressable>
          </View>

          {description ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              {description}
            </Text>
          ) : null}

          {children}

          {actions?.length ? (
            <View style={[styles.actionRow, { gap: spacing.sm }]}>
              {actions.map((action) => (
                <Button
                  iconName={action.iconName}
                  key={action.label}
                  label={action.label}
                  onPress={action.onPress}
                  variant={action.variant ?? "default"}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 560,
    width: "100%",
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
