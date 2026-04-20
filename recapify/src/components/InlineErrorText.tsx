import { Text } from "react-native";

import { useThemeTokens } from "../hooks";

type InlineErrorTextProps = {
  message?: string | null;
  size?: "sm" | "md";
};

export const InlineErrorText = ({
  message,
  size = "sm",
}: InlineErrorTextProps) => {
  const { colors, typography } = useThemeTokens();

  if (!message) {
    return null;
  }

  return (
    <Text
      style={{
        color: colors.danger,
        fontSize: size === "md" ? typography.secondary.md : typography.secondary.sm,
      }}
    >
      {message}
    </Text>
  );
};
