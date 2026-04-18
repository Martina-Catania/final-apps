import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Accordion,
  Avatar,
  Button,
  FileUploadField,
  AppTextInput,
  type UploadedFile,
} from "../components";
import { useAuth } from "../context/auth-context";
import { useThemeTokens } from "../hooks";
import {
  getUserApiErrorMessage,
  updateCurrentUserPasswordRequest,
  updateCurrentUserProfileRequest,
  uploadCurrentUserAvatarRequest,
} from "../utils/user-api";
import { getApiHostUrl } from "../utils/api-config";

const API_HOST = getApiHostUrl();

function resolveAvatarUri(avatarUrl: string | null) {
  if (!avatarUrl) {
    return undefined;
  }

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  return `${API_HOST}${avatarUrl}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const { token, user, refreshUser } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [selectedAvatar, setSelectedAvatar] = useState<UploadedFile | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setUsername(user?.username ?? "");
  }, [user?.name, user?.username]);

  const previewAvatarUri = useMemo(() => {
    if (selectedAvatar?.uri) {
      return selectedAvatar.uri;
    }

    return resolveAvatarUri(user?.avatarUrl ?? null);
  }, [selectedAvatar?.uri, user?.avatarUrl]);

  const handleSaveProfile = async () => {
    if (!token) {
      setErrorMessage("You must be signed in to update profile details");
      return;
    }

    setErrorMessage(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      await updateCurrentUserProfileRequest(
        {
          name: name.trim(),
          username: username.trim(),
        },
        token,
      );

      await refreshUser();
      setProfileMessage("Profile details updated");
    } catch (error) {
      setErrorMessage(getUserApiErrorMessage(error, "Unable to update profile details"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!token) {
      setErrorMessage("You must be signed in to update your avatar");
      return;
    }

    if (!selectedAvatar) {
      setErrorMessage("Pick an image first");
      return;
    }

    setErrorMessage(null);
    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    try {
      await uploadCurrentUserAvatarRequest(
        {
          uri: selectedAvatar.uri,
          name: selectedAvatar.name,
          mimeType: selectedAvatar.mimeType,
          webFile: selectedAvatar.webFile,
        },
        token,
      );

      await refreshUser();
      setSelectedAvatar(null);
      setAvatarMessage("Avatar updated");
    } catch (error) {
      setErrorMessage(getUserApiErrorMessage(error, "Unable to upload avatar"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) {
      setErrorMessage("You must be signed in to update your password");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage("Fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match");
      return;
    }

    setErrorMessage(null);
    setPasswordMessage(null);
    setIsChangingPassword(true);

    try {
      await updateCurrentUserPasswordRequest(
        {
          currentPassword,
          newPassword,
        },
        token,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated");
    } catch (error) {
      setErrorMessage(getUserApiErrorMessage(error, "Unable to update password"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <View style={[styles.rowBetween, { gap: spacing.sm }]}>
          <Button
            iconName="arrow-back-outline"
            label="Back"
            onPress={() => {
              if (user?.id) {
                router.replace({
                  pathname: "/profile/[id]",
                  params: {
                    id: String(user.id),
                  },
                });
                return;
              }

              router.back();
            }}
            variant="icon"
          />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.md,
              fontWeight: typography.weights.bold,
            }}
          >
            Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.md,
              padding: spacing.lg,
            },
          ]}
        >
          <Avatar avatarUri={previewAvatarUri} name={name || user?.name || "Current user"} />

          {errorMessage ? (
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.secondary.md,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}

          {profileMessage ? (
            <Text
              style={{
                color: colors.success,
                fontSize: typography.secondary.md,
              }}
            >
              {profileMessage}
            </Text>
          ) : null}

          {avatarMessage ? (
            <Text
              style={{
                color: colors.success,
                fontSize: typography.secondary.md,
              }}
            >
              {avatarMessage}
            </Text>
          ) : null}

          {passwordMessage ? (
            <Text
              style={{
                color: colors.success,
                fontSize: typography.secondary.md,
              }}
            >
              {passwordMessage}
            </Text>
          ) : null}
        </View>

        <Accordion defaultExpanded title="Profile details">
          <View style={{ gap: spacing.md }}>
            <AppTextInput
              label="Name"
              onChangeText={setName}
              placeholder="Your name"
              value={name}
            />
            <AppTextInput
              autoCapitalize="none"
              label="Username"
              onChangeText={setUsername}
              placeholder="username"
              value={username}
            />
            <Button
              disabled={isSavingProfile}
              fullWidth
              iconName="save-outline"
              label={isSavingProfile ? "Saving..." : "Save profile details"}
              onPress={() => {
                void handleSaveProfile();
              }}
              variant="primary"
            />
          </View>
        </Accordion>

        <Accordion title="Profile picture">
          <View style={{ gap: spacing.md }}>
            <FileUploadField
              allowedTypes={["image/*"]}
              clearButtonLabel="Clear image"
              helperText="Pick a JPEG, PNG, WEBP, or GIF image (max 5MB)."
              label="Upload avatar"
              onFileSelected={setSelectedAvatar}
              pickButtonLabel="Pick image"
            />
            <Button
              disabled={isUploadingAvatar || !selectedAvatar}
              fullWidth
              iconName="cloud-upload-outline"
              label={isUploadingAvatar ? "Uploading..." : "Upload avatar"}
              onPress={() => {
                void handleUploadAvatar();
              }}
              variant="primary"
            />
          </View>
        </Accordion>

        <Accordion title="Password">
          <View style={{ gap: spacing.md }}>
            <AppTextInput
              label="Current password"
              onChangeText={setCurrentPassword}
              secureTextEntry
              value={currentPassword}
            />
            <AppTextInput
              label="New password"
              onChangeText={setNewPassword}
              secureTextEntry
              value={newPassword}
            />
            <AppTextInput
              label="Confirm new password"
              onChangeText={setConfirmPassword}
              secureTextEntry
              value={confirmPassword}
            />
            <Button
              disabled={isChangingPassword}
              fullWidth
              iconName="lock-closed-outline"
              label={isChangingPassword ? "Updating..." : "Update password"}
              onPress={() => {
                void handleChangePassword();
              }}
              variant="primary"
            />
          </View>
        </Accordion>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
