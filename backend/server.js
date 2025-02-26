import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Resend } from 'resend';
import apiRoutes from './apiRoutes.js';
import oauthRoutes from './oauth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use('/', oauthRoutes);
app.use("/api", apiRoutes);

app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse JSON request body

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
