export default class JsonLogger {
    public static DEFAULT_LOG_KEY = 'JsonLogger';

    public static logObject(input: object): void;
    public static logObject(input: object, key: string): void;
    public static logObject(input: object, key?: string): void {
        console.log(`[${key ?? JsonLogger.DEFAULT_LOG_KEY}]:   `, JSON.stringify(input, null, 2));
    }

    public static logString(input: string): void;
    public static logString(input: string, key: string): void;
    public static logString(input: string, key?: string): void {
        console.log(`[${key ?? JsonLogger.DEFAULT_LOG_KEY}]:   `, JSON.parse(input));
    }

    public static logArray(input?: any[] | null): void;
    public static logArray(input: any[] | null, key: string): void;
    public static logArray(input: any[] | null, key?: string): void {
        if (!input) {
            console.log(`[${key ?? JsonLogger.DEFAULT_LOG_KEY}]:   `, `Bad Input`);
            return;
        }

        input.forEach((i) => JsonLogger.logObject(i, key ?? JsonLogger.DEFAULT_LOG_KEY));
    }
}
