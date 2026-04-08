import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const memoryStore = new Map<string, string>();
const SECURESTORE_SOFT_LIMIT = 1800;
const SECURESTORE_PREFIX = "kv_";

function getFallbackKey(key: string) {
  const normalizedKey = String(key || "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${SECURESTORE_PREFIX}${normalizedKey}`;
}

async function safeSecureGet(key: string) {
  try {
    return await SecureStore.getItemAsync(getFallbackKey(key));
  } catch {
    return null;
  }
}

async function safeSecureSet(key: string, value: string) {
  if (value.length > SECURESTORE_SOFT_LIMIT) {
    return;
  }

  try {
    await SecureStore.setItemAsync(getFallbackKey(key), value);
  } catch {
    // Ignore fallback storage failures.
  }
}

async function safeSecureRemove(key: string) {
  try {
    await SecureStore.deleteItemAsync(getFallbackKey(key));
  } catch {
    // Ignore fallback storage failures.
  }
}

const keyValueStorage = {
  async getItem(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      if (memoryStore.has(key)) {
        return memoryStore.get(key) ?? null;
      }

      return await safeSecureGet(key);
    }
  },

  async setItem(key: string, value: string) {
    memoryStore.set(key, value);

    try {
      await AsyncStorage.setItem(key, value);
      await safeSecureRemove(key);
      return;
    } catch {
      await safeSecureSet(key, value);
    }
  },

  async removeItem(key: string) {
    memoryStore.delete(key);

    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore missing async storage backend.
    }

    await safeSecureRemove(key);
  },
};

export default keyValueStorage;
