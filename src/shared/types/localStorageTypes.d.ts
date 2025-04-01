export const LOCAL_STORAGE = {
    user_cuid: "user_cuid",
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
} as const;

export type LocalStorage = typeof LOCAL_STORAGE;
export type LocalStorageKeys = keyof LocalStorage;
