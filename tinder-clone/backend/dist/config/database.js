"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const loadEnvFile = () => {
    const candidates = [
        path_1.default.resolve(process.cwd(), '.env'),
        path_1.default.resolve(process.cwd(), '..', '.env'),
        path_1.default.resolve(process.cwd(), '..', '..', '.env'),
        path_1.default.resolve(__dirname, '../../.env'),
        path_1.default.resolve(__dirname, '../../../.env')
    ];
    for (const candidate of candidates) {
        if (!fs_1.default.existsSync(candidate))
            continue;
        const contents = fs_1.default.readFileSync(candidate, 'utf8');
        for (const line of contents.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            const separatorIndex = trimmed.indexOf('=');
            if (separatorIndex === -1)
                continue;
            const key = trimmed.slice(0, separatorIndex).trim();
            const rawValue = trimmed.slice(separatorIndex + 1).trim();
            const value = rawValue.replace(/^['"]|['"]$/g, '');
            if (!(key in process.env)) {
                process.env[key] = value;
            }
        }
    }
};
loadEnvFile();
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/tinder_clone';
(_a = process.env).JWT_ACCESS_SECRET || (_a.JWT_ACCESS_SECRET = 'super_secret_access_key');
(_b = process.env).JWT_REFRESH_SECRET || (_b.JWT_REFRESH_SECRET = 'super_secret_refresh_key');
(_c = process.env).FRONTEND_URL || (_c.FRONTEND_URL = 'http://localhost:5173');
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
