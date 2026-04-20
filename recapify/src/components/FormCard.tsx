import { type ReactNode } from "react";
import {
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "../hooks";
import { Card } from "./Card";

type FormCardProps = {
  children: ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export const FormCard = ({
  children,
  maxWidth,
  style,
}: FormCardProps) => {
  const { spacing } = useThemeTokens();

  return (
    <Card
      style={[
        styles.card,
        {
          gap: spacing.lg,
          padding: spacing.lg,
        },
        typeof maxWidth === "number"
          ? {
              maxWidth,
            }
          : null,
        style,
      ]}
    >
      {children}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    width: "100%",
  },
});
