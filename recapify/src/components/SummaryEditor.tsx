import { type ReactElement, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";
import { useThemeTokens } from "../hooks";

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
  onChange?: (html: string) => void;
  placeholder?: string;
  useContainer?: boolean;
};

type NativeRichToolbarProps = {
  actions?: string[];
  disabled?: boolean;
  editor?: { current: NativeRichEditorRef | null };
  getEditor?: () => NativeRichEditorRef | null;
  iconTint?: string;
  selectedIconTint?: string;
  style?: StyleProp<ViewStyle>;
};

type NativeRichTextModule = {
  actions: {
    insertBulletsList: string;
    insertLink: string;
    insertOrderedList: string;
    redo: string;
    setBold: string;
    setItalic: string;
    setUnderline: string;
    undo: string;
  };
  RichEditor: (props: NativeRichEditorProps & { ref?: unknown }) => ReactElement;
  RichToolbar: (props: NativeRichToolbarProps) => ReactElement;
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

  const nativeInputRef = useRef<NativeRichEditorRef | null>(null);
  const lastKnownHtmlRef = useRef(value);
  const editorHeight = Math.max(minHeight - spacing.md * 2, 120);

  const isRichInputAvailable = Platform.OS !== "web" && nativeRichTextModule !== null;

  const NativeRichEditor = nativeRichTextModule?.RichEditor ?? null;
  const NativeRichToolbar = nativeRichTextModule?.RichToolbar ?? null;

  useEffect(() => {
    if (!isRichInputAvailable || !nativeInputRef.current) {
      return;
    }

    if (value === lastKnownHtmlRef.current) {
      return;
    }

    nativeInputRef.current.setContentHTML(value);
    lastKnownHtmlRef.current = value;
  }, [isRichInputAvailable, value]);

  const handleNativeRichChange = useCallback(
    (nextHtml: string) => {
      lastKnownHtmlRef.current = nextHtml;
      onChangeValue(nextHtml);
    },
    [onChangeValue],
  );

  const toolbarActions = useMemo(() => {
    if (!nativeRichTextModule) {
      return [];
    }

    const { actions } = nativeRichTextModule;
    return [
      actions.setBold,
      actions.setItalic,
      actions.setUnderline,
      actions.insertBulletsList,
      actions.insertOrderedList,
      actions.insertLink,
      actions.undo,
      actions.redo,
    ];
  }, []);

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

      {isRichInputAvailable && NativeRichEditor && NativeRichToolbar ? (
        <View style={{ gap: spacing.sm }}>
                      <NativeRichToolbar
              actions={toolbarActions}
              disabled={!editable}
              editor={nativeInputRef}
              getEditor={() => nativeInputRef.current}
              iconTint={colors.textSecondary}
              selectedIconTint={colors.primary}
              style={[
                styles.toolbar,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  minHeight: spacing.lg * 2,
                },
              ]}
            />
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
            <NativeRichEditor
              disabled={!editable}
              editorStyle={{
                backgroundColor: colors.surface,
                caretColor: colors.primary,
                color: colors.textPrimary,
                contentCSSText: `font-size: ${typography.secondary.lg}px; line-height: ${Math.round(typography.secondary.lg * 1.5)}px; color: ${colors.textPrimary};`,
                cssText: `a { color: ${colors.primary}; text-decoration: underline; }`,
                placeholderColor: colors.textSecondary,
              }}
              initialContentHTML={value}
              initialHeight={editorHeight}
              onChange={handleNativeRichChange}
              placeholder={placeholder}
              ref={nativeInputRef as unknown as undefined}
              useContainer={false}
            />
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
  toolbar: {
    borderWidth: 1,
  },
});
