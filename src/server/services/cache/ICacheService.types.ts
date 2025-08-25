export interface ICacheService {
    get: <T>(key: string) => Promise<T | undefined>;
    set: <T>(key: string, value: T) => Promise<boolean>;
    del: (key: string) => Promise<number | boolean>;
    flush: () => Promise<string | void>;
}
