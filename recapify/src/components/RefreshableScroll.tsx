import { type ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "../hooks";

type RefreshableScrollProps = {
  children: ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export const RefreshableScroll = ({
  children,
  refreshing,
  onRefresh,
  contentContainerStyle,
}: RefreshableScrollProps) => {
  const { colors } = useThemeTokens();

  return (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={onRefresh}
          progressBackgroundColor={colors.surface}
          refreshing={refreshing}
          tintColor={colors.primary}
        />
      }
    >
      {children}
    </ScrollView>
  );
};
