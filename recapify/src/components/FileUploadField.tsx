import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { AppButton } from "./Button";

export type UploadedFile = {
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

const useFileUpload = () => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async () => {
    setIsPicking(true);
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selected = result.assets[0];
      setFile({
        name: selected.name,
        uri: selected.uri,
        mimeType: selected.mimeType,
        size: selected.size,
      });
    } catch {
      setError("Could not pick a file. Please try again.");
    } finally {
      setIsPicking(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return {
    file,
    isPicking,
    error,
    pickFile,
    clearFile,
  };
};

type FileUploadFieldProps = {
  label?: string;
  helperText?: string;
  onFileSelected?: (file: UploadedFile | null) => void;
};

const bytesToSize = (bytes?: number) => {
  if (!bytes) {
    return "Unknown size";
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
};

export const FileUploadField = ({
  label = "Upload file",
  helperText = "Pick any file to test the upload flow.",
  onFileSelected,
}: FileUploadFieldProps) => {
  const { file, isPicking, error, pickFile, clearFile } = useFileUpload();
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  useEffect(() => {
    onFileSelected?.(file);
  }, [file, onFileSelected]);

  const handlePick = async () => {
    await pickFile();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          gap: spacing.sm,
          padding: spacing.md,
        },
      ]}
    >
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.secondary.lg,
          fontWeight: typography.weights.semibold,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.secondary.sm,
        }}
      >
        {helperText}
      </Text>

      <View style={[styles.buttonRow, { gap: spacing.sm }]}>
        <AppButton
          iconName="cloud-upload-outline"
          label={isPicking ? "Picking..." : "Pick file"}
          onPress={handlePick}
          variant="primary"
        />
        <AppButton label="Clear" onPress={clearFile} variant="default" />
      </View>

      {file ? (
        <View style={[styles.fileInfo, { backgroundColor: colors.surfaceMuted, gap: spacing.xs }]}> 
          <View style={[styles.fileRow, { gap: spacing.sm }]}>
            <Ionicons color={colors.secondary} name="document-text-outline" size={iconSizes.md} />
            <Text
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                flex: 1,
                fontSize: typography.secondary.md,
                fontWeight: typography.weights.medium,
              }}
            >
              {file.name}
            </Text>
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            {bytesToSize(file.size)}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.sm,
            }}
          >
            {file.mimeType ?? "Unknown file type"}
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text
          style={{
            color: colors.danger,
            fontSize: typography.secondary.sm,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fileInfo: {
    borderRadius: 10,
    padding: 10,
  },
  fileRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
