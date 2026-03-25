import * as SecureStore from "expo-secure-store";

// ── Keys ────────────────────────────────────────────────
const KEYS = {
  TOKEN: "STONE_WALA_AUTH_TOKEN",
  ROLE: "STONE_WALA_USER_ROLE",
} as const;

// ── Token ───────────────────────────────────────────────
export const saveToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.TOKEN, token);
  } catch (error) {
    console.error("[Storage] Failed to save token:", error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.TOKEN);
  } catch (error) {
    console.error("[Storage] Failed to get token:", error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.TOKEN);
  } catch (error) {
    console.error("[Storage] Failed to remove token:", error);
  }
};

// ── Role ────────────────────────────────────────────────
export const saveRole = async (role: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.ROLE, role);
  } catch (error) {
    console.error("[Storage] Failed to save role:", error);
  }
};

export const getRole = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.ROLE);
  } catch (error) {
    console.error("[Storage] Failed to get role:", error);
    return null;
  }
};

export const removeRole = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.ROLE);
  } catch (error) {
    console.error("[Storage] Failed to remove role:", error);
  }
};

// ── Clear All (Logout) ──────────────────────────────────
export const clearStorage = async (): Promise<void> => {
  await Promise.all([removeToken(), removeRole()]);
};