import { type ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useRefreshControlProps } from "../hooks";

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
  const refreshControlProps = useRefreshControlProps({
    onRefresh,
    refreshing,
  });

  return (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl {...refreshControlProps} />
      }
    >
      {children}
    </ScrollView>
  );
};
