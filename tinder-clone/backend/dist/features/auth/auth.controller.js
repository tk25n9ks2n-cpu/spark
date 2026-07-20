"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const SECRET = process.env.JWT_ACCESS_SECRET || 'super_secret_access_key';
const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await database_1.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ error: 'Email already in use' });
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await database_1.prisma.user.create({
            data: { email, passwordHash, name, dob: new Date(), gender: 'other' }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash)
            return res.status(400).json({ error: 'Invalid credentials' });
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid)
            return res.status(400).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
