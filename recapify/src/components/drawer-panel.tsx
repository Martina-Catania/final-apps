import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type DrawerPanelProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  children?: ReactNode;
};

export const DrawerPanel = ({
  visible,
  onClose,
  title = "Menu",
  width = 290,
  children,
}: DrawerPanelProps) => {
  const { colors, iconSizes, spacing, typography } = useThemeTokens();
  const translateX = useRef(new Animated.Value(-width)).current;
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(translateX, {
      toValue: -width,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [translateX, visible, width]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      onRequestClose={onClose}
      transparent
      visible
    >
      <View style={styles.root}>
        <Pressable
          onPress={onClose}
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        />

        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ translateX }],
              width,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
              },
            ]}
          >
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
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Ionicons color={colors.textSecondary} name="close" size={iconSizes.lg} />
            </Pressable>
          </View>

          <View style={{ padding: spacing.md }}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    borderRightWidth: 1,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
});
