import { type ReactNode } from "react";
import {
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { RefreshableScroll } from "../components/RefreshableScroll";

type SafeAreaPageProps = {
  children: ReactNode;
  backgroundColor: string;
  topContent?: ReactNode;
  bottomContent?: ReactNode;
  topBackgroundColor?: string;
  bottomBackgroundColor?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function SafeAreaPage({
  children,
  backgroundColor,
  topContent,
  bottomContent,
  topBackgroundColor,
  bottomBackgroundColor,
  refreshing,
  onRefresh,
  contentContainerStyle,
}: SafeAreaPageProps) {
  const resolvedTopBackground = topBackgroundColor ?? backgroundColor;
  const resolvedBottomBackground = bottomBackgroundColor ?? backgroundColor;
  const rootEdges: Edge[] = ["left", "right"];
  const canRefresh = typeof onRefresh === "function";

  if (!topContent) {
    rootEdges.push("top");
  }

  if (!bottomContent) {
    rootEdges.push("bottom");
  }

  return (
    <SafeAreaView edges={rootEdges} style={[styles.safeArea, { backgroundColor }]}>
      <View style={styles.screen}>
        {topContent ? (
          <SafeAreaView edges={["top"]} style={{ backgroundColor: resolvedTopBackground }}>
            {topContent}
          </SafeAreaView>
        ) : null}

        <View style={styles.content}>
          {canRefresh ? (
            <RefreshableScroll
              contentContainerStyle={contentContainerStyle}
              onRefresh={onRefresh}
              refreshing={refreshing ?? false}
            >
              {children}
            </RefreshableScroll>
          ) : (
            children
          )}
        </View>

        {bottomContent ? (
          <SafeAreaView
            edges={["bottom"]}
            style={{ backgroundColor: resolvedBottomBackground }}
          >
            {bottomContent}
          </SafeAreaView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});