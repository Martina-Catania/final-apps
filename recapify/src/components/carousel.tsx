import { Ionicons } from "@expo/vector-icons";
import { type ComponentProps, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useThemeTokens } from "../hooks";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type CarouselItem = {
  id: string;
  title: string;
  description: string;
  iconName?: IconName;
  accentColor?: string;
};

type CarouselProps = {
  items: CarouselItem[];
};

const useCarousel = <T,>(itemCount: number) => {
  const listRef = useRef<FlatList<T>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  const updateActiveIndex = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    const safeIndex = Math.min(Math.max(index, 0), Math.max(itemCount - 1, 0));
    setActiveIndex(safeIndex);
  };

  const snapTo = (index: number) => {
    const safeIndex = Math.min(Math.max(index, 0), Math.max(itemCount - 1, 0));

    listRef.current?.scrollToIndex({
      index: safeIndex,
      animated: true,
    });

    setActiveIndex(safeIndex);
  };

  return {
    listRef,
    activeIndex,
    screenWidth,
    snapTo,
    updateActiveIndex,
  };
};

export const Carousel = ({ items }: CarouselProps) => {
  const { activeIndex, listRef, screenWidth, snapTo, updateActiveIndex } =
    useCarousel<CarouselItem>(items.length);
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  return (
    <View style={[styles.container, { gap: spacing.md }]}> 
      <FlatList
        data={items}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={updateActiveIndex}
        pagingEnabled
        ref={listRef}
        renderItem={({ item }) => (
          <View style={{ width: screenWidth }}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  gap: spacing.sm,
                  marginHorizontal: spacing.lg,
                  padding: spacing.lg,
                },
              ]}
            >
              <View style={[styles.titleRow, { gap: spacing.sm }]}>
                {item.iconName ? (
                  <Ionicons
                    color={item.accentColor ?? colors.primary}
                    name={item.iconName}
                    size={iconSizes.md}
                  />
                ) : null}
                <Text
                  style={{
                    color: colors.textPrimary,
                    flex: 1,
                    fontSize: typography.primary.sm,
                    fontWeight: typography.weights.bold,
                  }}
                >
                  {item.title}
                </Text>
              </View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                {item.description}
              </Text>
            </View>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View style={[styles.dots, { gap: spacing.xs }]}> 
        {items.map((item, index) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => snapTo(index)}
            style={({ pressed }) => [
              styles.dot,
              {
                backgroundColor:
                  index === activeIndex ? colors.primary : colors.surfaceMuted,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
});
