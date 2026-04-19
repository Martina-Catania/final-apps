import { type ReactElement, useCallback } from "react";
import {
  Linking,
  Platform,
  Text,
  type TextStyle,
} from "react-native";

type NativeMarkdownTextProps = {
  markdown: string;
  flavor?: "github" | "commonmark";
  markdownStyle?: {
    link?: { color?: string; underline?: boolean };
    strong?: { color?: string };
  };
  onLinkPress?: (payload: { url: string }) => void;
};

type NativeMarkdownTextComponent = (props: NativeMarkdownTextProps) => ReactElement;

let NativeMarkdownText: NativeMarkdownTextComponent | null = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NativeMarkdownText = require("react-native-enriched-markdown").EnrichedMarkdownText as NativeMarkdownTextComponent;
  } catch {
    NativeMarkdownText = null;
  }
}

type SummaryMarkdownViewProps = {
  markdown: string;
  fontSize: number;
  lineHeight?: number;
  textColor: string;
  linkColor: string;
  style?: TextStyle;
};

export function SummaryMarkdownView({
  markdown,
  fontSize,
  lineHeight,
  textColor,
  linkColor,
  style,
}: SummaryMarkdownViewProps) {
  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  if (NativeMarkdownText) {
    return (
      <NativeMarkdownText
        flavor="github"
        markdown={markdown}
        markdownStyle={{
          link: {
            color: linkColor,
            underline: true,
          },
          strong: {
            color: textColor,
          },
        }}
        onLinkPress={({ url }) => {
          openLink(url);
        }}
      />
    );
  }

  return (
    <Text
      selectable
      style={[
        {
          color: textColor,
          fontSize,
          lineHeight: lineHeight ?? Math.round(fontSize * 1.5),
        },
        style,
      ]}
    >
      {markdown}
    </Text>
  );
}
