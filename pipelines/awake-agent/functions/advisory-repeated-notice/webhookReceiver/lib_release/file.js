import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

export function getDirname(importMetaUrl) {
    const __filename = fileURLToPath(importMetaUrl);
    return path.dirname(__filename);
}

export function readJsonFile(importMetaUrl, relativePath) {
    const dirname = getDirname(importMetaUrl);
    const fullPath = path.join(dirname, relativePath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

export function writeFile(importMetaUrl, relativePath, content) {
    const dirname = getDirname(importMetaUrl);
    const fullPath = path.join(dirname, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    console.log(`File written at: ${fullPath}`);
}

export function ensureDirectoryExists(importMetaUrl, relativePath) {
    const dirname = getDirname(importMetaUrl);
    const fullPath = path.join(dirname, relativePath);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
    return fullPath;
}

export function readConfig(importMetaUrl) {
    return readJsonFile(importMetaUrl, 'config.json');
}