import { useMemo } from "react";
import { type RefreshControlProps } from "react-native";

import { useThemeTokens } from "./use-theme-tokens";

type UseRefreshControlPropsArgs = Pick<
  RefreshControlProps,
  "onRefresh" | "refreshing"
>;

export function useRefreshControlProps({
  onRefresh,
  refreshing,
}: UseRefreshControlPropsArgs) {
  const { colors } = useThemeTokens();

  return useMemo<
    Pick<
      RefreshControlProps,
      "colors" | "onRefresh" | "progressBackgroundColor" | "refreshing" | "tintColor"
    >
  >(
    () => ({
      colors: [colors.primary],
      onRefresh,
      progressBackgroundColor: colors.surface,
      refreshing,
      tintColor: colors.primary,
    }),
    [colors.primary, colors.surface, onRefresh, refreshing],
  );
}
