import { ApiClient } from "@baseforge/api-client";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "baseforge_auth_token";
const REFRESH_TOKEN_KEY = "baseforge_refresh_token";

const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }
};

const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }
};

export const api = new ApiClient({
  baseURL: "http://localhost:3000/api/v1",
  getToken: () => getStorageItem(TOKEN_KEY),
  getRefreshToken: () => getStorageItem(REFRESH_TOKEN_KEY),
  onTokenRefresh: async (newAccess, newRefresh) => {
    await setStorageItem(TOKEN_KEY, newAccess);
    await setStorageItem(REFRESH_TOKEN_KEY, newRefresh);
  },
  onAuthError: async () => {
    await deleteStorageItem(TOKEN_KEY);
    await deleteStorageItem(REFRESH_TOKEN_KEY);
  },
});
