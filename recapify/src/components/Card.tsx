import { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "../hooks";

type BaseCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type CardProps = Omit<ViewProps, "style"> & BaseCardProps;

type PressableCardProps = Omit<PressableProps, "style"> &
  BaseCardProps & {
    pressedOpacity?: number;
  };

const useCardSurface = () => {
  const { colors, radius } = useThemeTokens();

  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
  };
};

export const Card = ({ children, style, ...rest }: CardProps) => {
  const surfaceStyle = useCardSurface();

  return (
    <View style={[styles.base, surfaceStyle, style]} {...rest}>
      {children}
    </View>
  );
};

export const PressableCard = ({
  children,
  style,
  pressedOpacity = 0.85,
  ...rest
}: PressableCardProps) => {
  const surfaceStyle = useCardSurface();

  return (
    <Pressable
      style={({ pressed }) => ({
        opacity: pressed ? pressedOpacity : 1,
      })}
      {...rest}
    >
      <View style={[styles.base, surfaceStyle, style]}>{children}</View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
