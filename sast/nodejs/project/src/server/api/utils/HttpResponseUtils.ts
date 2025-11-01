import express from 'express';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY } from '../../..';

export default class HttpResponseUtils {
    static readonly ALGORITHM: string = 'aes-256-cbc';

    public static sendSuccess<T>(res: express.Response, data?: T) {
        res.sendEncrypted(data);
    }

    public static sendErrorBadRequest(res: express.Response, message?: string) {
        return res.status(400).send(message ?? "Bad Request");
    }

    public static sendErrorInternal(res: express.Response, message?: string) {
        return res.status(500).send(message ?? "Internal Server Error");
    }

    public static sendErrorUnauthorized(res: express.Response, message?: string) {
        return res.status(401).send(message ?? "Unauthorized");
    }

    public static parseJson<T>(body: string): T | null {
        try {
            return JSON.parse(body);
        } catch (error) {
            console.error("Failed to parse json", error);
            console.log(body);
            return null;
        }
    }
    public static decodeBase64(body: string): string {
        let decodedString = Buffer.from(body, 'base64').toString('utf8');
        return decodedString;

    }

    public static encrypt(text: string, userSession: string): string {
        try {
            const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
            
            const encryption_iv = userSession.substring(0, 18).replace(/-/g, '');
            const iv = CryptoJS.enc.Hex.parse(encryption_iv);

            const encrypted = CryptoJS.AES.encrypt(
                text,
                key,
                { iv: iv }
            );

            const encryptedBase64 = encrypted.toString();
            return encryptedBase64;
        } catch (e) {
            console.error("Error encrypting: ", e);
            return ''; 
        }
    }

}