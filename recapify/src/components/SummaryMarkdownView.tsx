import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";
import { richTextToPlainText } from "../utils/rich-text";

type NativeRichEditorRef = {
  setContentHTML: (html: string) => void;
};

type NativeRichEditorProps = {
  disabled?: boolean;
  editorStyle?: {
    backgroundColor?: string;
    caretColor?: string;
    color?: string;
    contentCSSText?: string;
    cssText?: string;
    placeholderColor?: string;
  };
  initialContentHTML?: string;
  initialHeight?: number;
  onHeightChange?: (height: number) => void;
  onLink?: (url: string) => void;
  useContainer?: boolean;
};

type NativeRichTextModule = {
  RichEditor: (props: NativeRichEditorProps & { ref?: unknown }) => ReactElement;
};

let nativeRichTextModule: NativeRichTextModule | null = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeRichTextModule = require("react-native-pell-rich-editor") as NativeRichTextModule;
  } catch {
    nativeRichTextModule = null;
  }
}

type SummaryMarkdownViewProps = {
  markdown: string;
  fontSize: number;
  lineHeight?: number;
  textColor: string;
  linkColor: string;
  style?: StyleProp<ViewStyle>;
};

export function SummaryMarkdownView({
  markdown,
  fontSize,
  lineHeight,
  textColor,
  linkColor,
  style,
}: SummaryMarkdownViewProps) {
  const nativeInputRef = useRef<NativeRichEditorRef | null>(null);
  const NativeRichEditor = nativeRichTextModule?.RichEditor ?? null;

  const plainText = useMemo(() => richTextToPlainText(markdown), [markdown]);
  const normalizedLineHeight = lineHeight ?? Math.round(fontSize * 1.5);
  const estimatedHeight = useMemo(() => {
    const lineCount = Math.max(plainText.split(/\r?\n/).length, 1);
    return Math.max(96, lineCount * normalizedLineHeight + 24);
  }, [normalizedLineHeight, plainText]);
  const [contentHeight, setContentHeight] = useState(estimatedHeight);

  const openLink = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  useEffect(() => {
    setContentHeight(estimatedHeight);
  }, [estimatedHeight]);

  useEffect(() => {
    if (!NativeRichEditor || !nativeInputRef.current) {
      return;
    }

    nativeInputRef.current.setContentHTML(markdown);
  }, [NativeRichEditor, markdown]);

  if (NativeRichEditor && Platform.OS !== "web") {
    return (
      <View
        style={[
          styles.richContentContainer,
          {
            minHeight: contentHeight,
          },
          style,
        ]}
      >
        <NativeRichEditor
          disabled
          editorStyle={{
            backgroundColor: "transparent",
            caretColor: textColor,
            color: textColor,
            contentCSSText: `font-size: ${fontSize}px; line-height: ${normalizedLineHeight}px; color: ${textColor};`,
            cssText: `body { margin: 0; padding: 0; color: ${textColor}; } a { color: ${linkColor}; text-decoration: underline; }`,
            placeholderColor: textColor,
          }}
          initialContentHTML={markdown}
          initialHeight={contentHeight}
          onHeightChange={(height) => {
            setContentHeight(Math.max(estimatedHeight, Math.ceil(height)));
          }}
          onLink={openLink}
          ref={nativeInputRef as unknown as undefined}
          useContainer={false}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Text
        selectable
        style={[
          {
            color: textColor,
            fontSize,
            lineHeight: normalizedLineHeight,
          },
        ]}
      >
        {plainText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  richContentContainer: {
    overflow: "hidden",
  },
});
