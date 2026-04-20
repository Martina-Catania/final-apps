import {
  useCameraPermissions,
  type CameraType,
  type CameraView,
} from "expo-camera";
import { useCallback, useRef, useState } from "react";

type CapturedPhoto = {
  uri: string;
  format?: string | null;
};

type UseCameraCaptureOptions = {
  isBusy?: boolean;
  onCapture: (photo: CapturedPhoto) => Promise<void> | void;
  onError: (message: string) => void;
  formatErrorMessage?: (error: unknown, fallbackMessage: string) => string;
  captureQuality?: number;
};

export function useCameraCapture(options: UseCameraCaptureOptions) {
  const {
    isBusy = false,
    onCapture,
    onError,
    formatErrorMessage,
    captureQuality = 0.85,
  } = options;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const ensureCameraPermission = useCallback(async () => {
    if (cameraPermission?.granted) {
      return true;
    }

    const permissionResponse = await requestCameraPermission();

    if (permissionResponse.granted) {
      return true;
    }

    onError(
      permissionResponse.canAskAgain
        ? "Camera permission is required to take a profile picture"
        : "Camera permission is disabled. Enable it in settings to take a profile picture",
    );
    return false;
  }, [cameraPermission?.granted, onError, requestCameraPermission]);

  const prepareCameraCapture = useCallback(async () => {
    const hasPermission = await ensureCameraPermission();

    if (!hasPermission) {
      return false;
    }

    setCameraFacing("front");
    setIsCameraReady(false);
    return true;
  }, [ensureCameraPermission]);

  const resetCameraCaptureState = useCallback(() => {
    setIsCameraReady(false);
  }, []);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const handleCameraMountError = useCallback(() => {
    onError("Unable to start camera preview");
  }, [onError]);

  const flipCamera = useCallback(() => {
    setCameraFacing((current) => (current === "back" ? "front" : "back"));
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing || isBusy) {
      return false;
    }

    setIsCapturing(true);

    try {
      const capturedPhoto = await cameraRef.current.takePictureAsync({
        quality: captureQuality,
      });

      await onCapture({
        uri: capturedPhoto.uri,
        format: capturedPhoto.format,
      });
      return true;
    } catch (error) {
      const message = formatErrorMessage
        ? formatErrorMessage(error, "Unable to capture image")
        : "Unable to capture image";

      onError(message);
      return false;
    } finally {
      setIsCapturing(false);
    }
  }, [captureQuality, formatErrorMessage, isBusy, isCameraReady, isCapturing, onCapture, onError]);

  return {
    cameraRef,
    cameraPermission,
    cameraPermissionGranted: Boolean(cameraPermission?.granted),
    cameraFacing,
    isCameraReady,
    isCapturing,
    prepareCameraCapture,
    resetCameraCaptureState,
    handleCameraReady,
    handleCameraMountError,
    flipCamera,
    capturePhoto,
  };
}
