"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_key';
/** Verifies the Bearer token and attaches userId to the request. */
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'Not authenticated' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.requireAuth = requireAuth;
