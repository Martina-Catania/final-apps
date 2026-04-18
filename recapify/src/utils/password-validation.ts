import * as Crypto from "expo-crypto";

export type PasswordValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least one letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export async function checkPasswordBreach(password: string): Promise<{
  isBreached: boolean;
  error?: string;
}> {
  try {
    const hashHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      password,
      { encoding: Crypto.CryptoEncoding.HEX },
    );
    const fullHash = hashHex.toUpperCase();
    const hashPrefix = fullHash.slice(0, 5);
    const hashSuffix = fullHash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseText = await response.text();
    const lines = responseText.split("\n");
    const isBreached = lines.some((line) => {
      const [suffix] = line.trim().split(":");
      return suffix === hashSuffix;
    });

    if (isBreached) {
      return {
        isBreached: true,
        error:
          "This password has been found in data breaches and is not secure. Please choose a different password.",
      };
    }

    return { isBreached: false };
  } catch {
    return {
      isBreached: false,
      error:
        "Unable to verify password security at this time. Please ensure your password meets all requirements.",
    };
  }
}

export async function validatePasswordWithBreachCheck(password: string): Promise<{
  isValid: boolean;
  errors: string[];
  isBreached?: boolean;
}> {
  const basicValidation = validatePassword(password);
  if (!basicValidation.isValid) {
    return {
      isValid: false,
      errors: basicValidation.errors,
    };
  }

  const breachCheck = await checkPasswordBreach(password);
  console.log("Password breach check result:", breachCheck);
  if (breachCheck.isBreached) {
    return {
      isValid: false,
      errors: [breachCheck.error ?? "Password has been compromised"],
      isBreached: true,
    };
  }

  return {
    isValid: true,
    errors: [],
    isBreached: false,
  };
}