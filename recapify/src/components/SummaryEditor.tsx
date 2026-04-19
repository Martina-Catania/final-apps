import { type ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextStyle,
  View,
} from "react-native";
import { useThemeTokens } from "../hooks";

type NativeMarkdownInputRef = {
  setValue: (markdown: string) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
};

type NativeMarkdownInputProps = {
  defaultValue?: string;
  editable?: boolean;
  multiline?: boolean;
  onChangeMarkdown?: (markdown: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  markdownStyle?: {
    strong?: { color?: string };
    em?: { color?: string };
    link?: { color?: string; underline?: boolean };
  };
  style?: TextStyle;
};

type NativeMarkdownInputComponent = (props: NativeMarkdownInputProps & { ref?: unknown }) => ReactElement;

let NativeMarkdownInput: NativeMarkdownInputComponent | null = null;

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NativeMarkdownInput = require("react-native-enriched-markdown").EnrichedMarkdownInput as NativeMarkdownInputComponent;
  } catch {
    NativeMarkdownInput = null;
  }
}

type SummaryEditorProps = {
  value: string;
  onChangeValue: (value: string) => void;
  label?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  minHeight?: number;
  editable?: boolean;
};

export function SummaryEditor({
  value,
  onChangeValue,
  label,
  helperText,
  errorText,
  placeholder,
  minHeight = 180,
  editable = true,
}: SummaryEditorProps) {
  const { colors, radius, spacing, typography } = useThemeTokens();
  const hasError = Boolean(errorText);

  const nativeInputRef = useRef<NativeMarkdownInputRef | null>(null);
  const lastKnownMarkdownRef = useRef(value);

  const isRichInputAvailable = Platform.OS !== "web" && NativeMarkdownInput !== null;

  useEffect(() => {
    if (!isRichInputAvailable || !nativeInputRef.current) {
      return;
    }

    if (value === lastKnownMarkdownRef.current) {
      return;
    }

    nativeInputRef.current.setValue(value);
    lastKnownMarkdownRef.current = value;
  }, [isRichInputAvailable, value]);

  const handleNativeMarkdownChange = useCallback(
    (nextMarkdown: string) => {
      lastKnownMarkdownRef.current = nextMarkdown;
      onChangeValue(nextMarkdown);
    },
    [onChangeValue],
  );

  const toolbarItems = useMemo(
    () => [
      {
        key: "bold",
        label: "Bold",
        onPress: () => nativeInputRef.current?.toggleBold(),
      },
      {
        key: "italic",
        label: "Italic",
        onPress: () => nativeInputRef.current?.toggleItalic(),
      },
      {
        key: "underline",
        label: "Underline",
        onPress: () => nativeInputRef.current?.toggleUnderline(),
      },
    ],
    [],
  );

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.secondary.md,
            fontWeight: typography.weights.semibold,
          }}
        >
          {label}
        </Text>
      ) : null}

      {isRichInputAvailable && NativeMarkdownInput ? (
        <View style={{ gap: spacing.sm }}>
          <View
            style={[
              styles.editorContainer,
              {
                backgroundColor: colors.surface,
                borderColor: hasError ? colors.danger : colors.border,
                borderRadius: radius.sm,
                minHeight,
                padding: spacing.md,
              },
            ]}
          >
            <NativeMarkdownInput
              defaultValue={value}
              editable={editable}
              markdownStyle={{
                strong: { color: colors.primary },
                em: { color: colors.secondary },
                link: {
                  color: colors.primary,
                  underline: true,
                },
              }}
              multiline
              onChangeMarkdown={handleNativeMarkdownChange}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              ref={nativeInputRef as unknown as undefined}
              style={{
                color: colors.textPrimary,
                fontSize: typography.secondary.lg,
                minHeight: minHeight - spacing.md * 2,
                textAlignVertical: "top",
              }}
            />
          </View>

          <View style={[styles.toolbarRow, { gap: spacing.xs }]}> 
            {toolbarItems.map((item) => (
              <Pressable
                accessibilityRole="button"
                disabled={!editable}
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.toolbarButton,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    opacity: !editable ? 0.6 : pressed ? 0.8 : 1,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.secondary.sm,
                    fontWeight: typography.weights.medium,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.editorContainer,
            {
              backgroundColor: colors.surface,
              borderColor: hasError ? colors.danger : colors.border,
              borderRadius: radius.sm,
              minHeight,
              padding: spacing.md,
            },
          ]}
        >
          <TextInput
            editable={editable}
            multiline
            onChangeText={onChangeValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={{
              color: colors.textPrimary,
              flex: 1,
              fontSize: typography.secondary.lg,
              minHeight: minHeight - spacing.md * 2,
              textAlignVertical: "top",
            }}
            underlineColorAndroid="transparent"
            value={value}
          />
        </View>
      )}

      {errorText ? (
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.secondary.sm,
          }}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.sm,
          }}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editorContainer: {
    borderWidth: 1,
  },
  toolbarButton: {
    borderWidth: 1,
  },
  toolbarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
