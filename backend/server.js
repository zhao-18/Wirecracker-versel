import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Resend } from 'resend';
import apiRoutes from './apiRoutes.js';
import oauthRoutes from './oauth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS with specific options
app.use(cors({
    origin: 'https://wirecracker-versel.vercel.app', // Your frontend URL
    credentials: true, // Allow credentials
    methods: ['GET', 'POST'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

app.use(express.json()); // Parse JSON request body

app.use('/', oauthRoutes);
app.use("/api", apiRoutes);

const resend = new Resend(process.env.RESEND_API_KEY);

// Email verification endpoint
app.post('/send-verification-email', async (req, res) => {
    const { email, code } = req.body;

    try {
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Your Verification Code',
            html: `<p>Your verification code is: <strong>${code}</strong></p>`,
        });

        console.log('Email sent:', response);
        res.status(200).json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send verification email' });
    }
});

export default app;
