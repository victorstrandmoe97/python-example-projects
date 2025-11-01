import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY } from "../../..";
import { IncomingHttpHeaders } from 'http';

export default class HttpRequestUtils {
    
    public static decrypt(text: string, userSession: string): string | null {
        try {
            //according to uuidv4 standard theres 2 - in the key and we remove them so the iv becomes 16 bytes
            const encryption_iv = userSession.substring(0, 18).replace(/-/g, '');

            const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);
            const iv = CryptoJS.enc.Hex.parse(encryption_iv);

            const decrypted = CryptoJS.AES.decrypt(
                text, 
                key,
                { iv: iv },
            );

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error("Error decrypt", e);
            return null;
        }
    }

    public static unscrambleSessionHeader(header: IncomingHttpHeaders['x-user-session']): string | null {
        if(!header) {
            return null;
        }

        if(header.length != 36) {
            return null;
        }

        const mapping: { [key: string]: string } = {
            'Z': '0',
            'B': '1',
            'C': '2',
            'D': '3',
            'E': '4',
            'F': '5',
            'T': '6',
            'H': '7',
            'I': '8',
            'M': '9',
            'K': 'a',
            'L': 'b',
            'R': 'c',
            'N': 'd',
            'O': 'e',
            'Q': 'f',
        };

        let sessionId = '';

        for (let i = 0; i < header.length; i++) {
            const character = header[i];
            if (character === '-') {
                sessionId += '-';
                continue;
            }
            if (!mapping[character]) {
                return null;
            }
            sessionId += mapping[character];
        }

        return sessionId;
    }
}