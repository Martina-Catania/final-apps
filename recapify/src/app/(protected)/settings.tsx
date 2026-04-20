import {
  CameraView,
  useCameraPermissions,
  type CameraType,
} from "expo-camera";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Accordion,
  AppActionSheet,
  AppModal,
  AppTextInput,
  Avatar,
  Button,
  FileUploadField,
  type UploadedFile,
} from "../../components";
import { useAuth } from "../../context/auth-context";
import { useSafeNavigation, useThemeTokens } from "../../hooks";
import {
  getUserApiErrorMessage,
  updateCurrentUserPasswordRequest,
  updateCurrentUserProfileRequest,
  uploadCurrentUserAvatarRequest,
} from "../../utils/user-api";
import { getApiHostUrl } from "../../utils/api-config";
import { SafeAreaPage } from "../../screens/safe-area-page";

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

type AvatarActionValue = "upload-file" | "use-camera";

type AvatarActionItem = {
  label: string;
  value: AvatarActionValue;
  iconName?: "cloud-upload-outline" | "camera-outline";
  disabled?: boolean;
};

export default function SettingsPage() {
  const { goBack } = useSafeNavigation();
  const { token, user, refreshUser } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [username, setUsername] = useState(user?.username ?? "");
  const [selectedAvatar, setSelectedAvatar] = useState<UploadedFile | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCapturingAvatarFromCamera, setIsCapturingAvatarFromCamera] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAvatarActionSheetOpen, setIsAvatarActionSheetOpen] = useState(false);
  const [isAvatarUploadModalOpen, setIsAvatarUploadModalOpen] = useState(false);
  const [isAvatarCameraModalOpen, setIsAvatarCameraModalOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? "");
  }, [user?.username]);

  const previewAvatarUri = useMemo(() => {
    if (selectedAvatar?.uri) {
      return selectedAvatar.uri;
    }

    return resolveAvatarUri(user?.avatarUrl ?? null);
  }, [selectedAvatar?.uri, user?.avatarUrl]);

  const handleOpenAvatarActionSheet = useCallback(() => {
    setErrorMessage(null);
    setAvatarMessage(null);
    setIsAvatarActionSheetOpen(true);
  }, []);

  const handleCloseAvatarActionSheet = useCallback(() => {
    setIsAvatarActionSheetOpen(false);
  }, []);

  const handleCloseAvatarUploadModal = useCallback(() => {
    if (isUploadingAvatar) {
      return;
    }

    setIsAvatarUploadModalOpen(false);
  }, [isUploadingAvatar]);

  const handleCloseAvatarCameraModal = useCallback(() => {
    if (isUploadingAvatar || isCapturingAvatarFromCamera) {
      return;
    }

    setIsAvatarCameraModalOpen(false);
    setIsCameraReady(false);
  }, [isCapturingAvatarFromCamera, isUploadingAvatar]);

  const ensureCameraPermission = useCallback(async () => {
    if (cameraPermission?.granted) {
      return true;
    }

    const permissionResponse = await requestCameraPermission();

    if (permissionResponse.granted) {
      return true;
    }

    setErrorMessage(
      permissionResponse.canAskAgain
        ? "Camera permission is required to take a profile picture"
        : "Camera permission is disabled. Enable it in settings to take a profile picture",
    );
    return false;
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleOpenAvatarCameraModal = useCallback(async () => {
    setErrorMessage(null);
    setAvatarMessage(null);

    const hasPermission = await ensureCameraPermission();

    if (!hasPermission) {
      return;
    }

    setCameraFacing("front");
    setIsCameraReady(false);
    setIsAvatarCameraModalOpen(true);
  }, [ensureCameraPermission]);

  const avatarActionItems = useMemo<AvatarActionItem[]>(
    () => [
      {
        label: "Upload from file",
        value: "upload-file",
        iconName: "cloud-upload-outline",
        disabled: isUploadingAvatar || isCapturingAvatarFromCamera,
      },
      {
        label: "Use camera",
        value: "use-camera",
        iconName: "camera-outline",
        disabled: isUploadingAvatar || isCapturingAvatarFromCamera,
      },
    ],
    [isCapturingAvatarFromCamera, isUploadingAvatar],
  );

  const handleSelectAvatarAction = useCallback(
    (value: AvatarActionValue) => {
      if (value === "upload-file") {
        setIsAvatarUploadModalOpen(true);
        return;
      }

      void handleOpenAvatarCameraModal();
    },
    [handleOpenAvatarCameraModal],
  );

  const uploadAvatar = useCallback(
    async (avatarFile: UploadedFile) => {
      if (!token) {
        setErrorMessage("You must be signed in to update your avatar");
        return false;
      }

      setErrorMessage(null);
      setAvatarMessage(null);
      setIsUploadingAvatar(true);

      try {
        await uploadCurrentUserAvatarRequest(
          {
            uri: avatarFile.uri,
            name: avatarFile.name,
            mimeType: avatarFile.mimeType,
            webFile: avatarFile.webFile,
          },
          token,
        );

        await refreshUser();
        setSelectedAvatar(null);
        setIsAvatarUploadModalOpen(false);
        setIsAvatarCameraModalOpen(false);
        setAvatarMessage("Avatar updated");
        return true;
      } catch (error) {
        setErrorMessage(getUserApiErrorMessage(error, "Unable to upload avatar"));
        return false;
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [refreshUser, token],
  );

  const handleFlipCamera = useCallback(() => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  }, []);

  const handleCaptureAvatarFromCamera = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady || isCapturingAvatarFromCamera || isUploadingAvatar) {
      return;
    }

    setErrorMessage(null);
    setAvatarMessage(null);
    setIsCapturingAvatarFromCamera(true);

    try {
      const capturedPhoto = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      const isPng = capturedPhoto.format === "png";
      const capturedAvatar: UploadedFile = {
        name: `avatar-${Date.now()}.${isPng ? "png" : "jpg"}`,
        uri: capturedPhoto.uri,
        mimeType: isPng ? "image/png" : "image/jpeg",
      };

      setSelectedAvatar(capturedAvatar);
      await uploadAvatar(capturedAvatar);
    } catch (error) {
      setErrorMessage(getUserApiErrorMessage(error, "Unable to capture image"));
    } finally {
      setIsCapturingAvatarFromCamera(false);
    }
  }, [isCameraReady, isCapturingAvatarFromCamera, isUploadingAvatar, uploadAvatar]);

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
    if (!selectedAvatar) {
      setErrorMessage("Pick an image first");
      return;
    }

    await uploadAvatar(selectedAvatar);
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
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordMessage("Password updated");
    } catch (error) {
      setErrorMessage(getUserApiErrorMessage(error, "Unable to update password"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={{
            gap: spacing.lg,
            padding: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <Button
              iconName="arrow-back-outline"
              label="Back"
              onPress={() => {
                goBack(
                  user?.id
                    ? {
                        pathname: "/profile/[id]",
                        params: {
                          id: String(user.id),
                        },
                      }
                    : "/",
                );
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
            <Avatar
              avatarUri={previewAvatarUri}
              name={username || user?.username || "Current user"}
              onPress={handleOpenAvatarActionSheet}
            />

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.sm,
              }}
            >
              Tap your avatar to update your profile picture.
            </Text>

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

          <Accordion title="Password">
            <View style={{ gap: spacing.md }}>
              <AppTextInput
                autoCapitalize="none"
                autoComplete="password"
                label="Current password"
                onChangeText={setCurrentPassword}
                onRightIconPress={() => setShowCurrentPassword((current) => !current)}
                rightIcon={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
              />
              <AppTextInput
                autoCapitalize="none"
                autoComplete="password"
                label="New password"
                onChangeText={setNewPassword}
                onRightIconPress={() => setShowNewPassword((current) => !current)}
                rightIcon={showNewPassword ? "eye-off-outline" : "eye-outline"}
                secureTextEntry={!showNewPassword}
                value={newPassword}
              />
              <AppTextInput
                autoCapitalize="none"
                autoComplete="password"
                label="Confirm new password"
                onChangeText={setConfirmPassword}
                onRightIconPress={() => setShowConfirmPassword((current) => !current)}
                rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                secureTextEntry={!showConfirmPassword}
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

        <AppActionSheet<AvatarActionValue>
          isOpen={isAvatarActionSheetOpen}
          items={avatarActionItems}
          onClose={handleCloseAvatarActionSheet}
          onSelect={handleSelectAvatarAction}
          title="Change profile picture"
        />

        <AppModal
          description="Take a photo and upload it as your profile picture."
          onClose={handleCloseAvatarCameraModal}
          title="Use camera"
          visible={isAvatarCameraModalOpen}
        >
          <View style={{ gap: spacing.md }}>
            <View
              style={[
                styles.cameraPreviewFrame,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <CameraView
                facing={cameraFacing}
                mode="picture"
                onCameraReady={() => {
                  setIsCameraReady(true);
                }}
                onMountError={() => {
                  setErrorMessage("Unable to start camera preview");
                }}
                ref={cameraRef}
                style={styles.cameraPreview}
              />
            </View>

            <View style={[styles.modalActions, { gap: spacing.sm }]}>
              <Button
                disabled={isUploadingAvatar || isCapturingAvatarFromCamera}
                iconName="close-outline"
                label="Cancel"
                onPress={handleCloseAvatarCameraModal}
                variant="default"
              />
              <Button
                disabled={
                  isUploadingAvatar ||
                  isCapturingAvatarFromCamera ||
                  !cameraPermission?.granted ||
                  !isCameraReady
                }
                iconName="camera-reverse-outline"
                label="Flip"
                onPress={handleFlipCamera}
                variant="default"
              />
              <Button
                disabled={
                  isUploadingAvatar ||
                  isCapturingAvatarFromCamera ||
                  !cameraPermission?.granted ||
                  !isCameraReady
                }
                iconName="camera-outline"
                label={
                  isCapturingAvatarFromCamera
                    ? "Capturing..."
                    : isUploadingAvatar
                      ? "Uploading..."
                      : "Take photo"
                }
                onPress={() => {
                  void handleCaptureAvatarFromCamera();
                }}
                variant="primary"
              />
            </View>
          </View>
        </AppModal>

        <AppModal
          description="Pick a JPEG, PNG, WEBP, or GIF image (max 5MB)."
          onClose={handleCloseAvatarUploadModal}
          title="Upload profile picture"
          visible={isAvatarUploadModalOpen}
        >
          <View style={{ gap: spacing.md }}>
            <FileUploadField
              allowedTypes={["image/*"]}
              clearButtonLabel="Clear image"
              helperText="Pick a JPEG, PNG, WEBP, or GIF image (max 5MB)."
              label="Upload avatar"
              onFileSelected={setSelectedAvatar}
              pickButtonLabel="Pick image"
            />

            <View style={[styles.modalActions, { gap: spacing.sm }]}>
              <Button
                disabled={isUploadingAvatar}
                iconName="close-outline"
                label="Cancel"
                onPress={handleCloseAvatarUploadModal}
                variant="default"
              />
              <Button
                disabled={isUploadingAvatar || !selectedAvatar}
                iconName="cloud-upload-outline"
                label={isUploadingAvatar ? "Uploading..." : "Upload avatar"}
                onPress={() => {
                  void handleUploadAvatar();
                }}
                variant="primary"
              />
            </View>
          </View>
        </AppModal>
      </KeyboardAvoidingView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
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
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  cameraPreviewFrame: {
    borderWidth: 1,
    height: 320,
    overflow: "hidden",
    width: "100%",
  },
  cameraPreview: {
    height: "100%",
    width: "100%",
  },
});
