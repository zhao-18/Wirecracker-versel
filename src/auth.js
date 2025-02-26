import { supabase } from './utils/supabaseClient';
//import { sendVerificationEmail } from './utils/emailService';
import { v4 as uuidv4 } from 'uuid';


export async function sendVerificationEmail(email, code) {
    try {
        const response = await fetch('https://wirecracker-versel.vercel.app/send-verification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
            throw new Error('Failed to send verification email');
        }

        console.log('Verification email sent successfully');
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to send email');
    }
}

export async function signUp(email, name, password) {
    // Hash password (in real-world apps, use a backend to hash)
    const { data: user, error } = await supabase
        .from('users')
        .insert([{ email, name, password_hash: password }])
        .select();

    if (error) throw new Error(error.message);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the verification code in the database
    await supabase.from('email_verification_codes').insert([
        { user_id: user[0].id, code: verificationCode, expires_at: new Date(Date.now() + 15 * 60 * 1000) }
    ]);

    console.log('Verification code:', verificationCode); // Replace with email service

    await sendVerificationEmail(email, verificationCode);

    return { message: 'Verification email sent' };
}

export async function verifyEmail(email, code) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) throw new Error('User not found');

    const { data: verificationRecord } = await supabase
        .from('email_verification_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', code)
        .single();

    if (!verificationRecord) throw new Error('Invalid or expired verification code');

    await supabase.from('email_verification_codes').delete().eq('user_id', user.id);

    return { message: 'Email verified. You can now log in.' };
}


export async function login(email, password, rememberMe) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .single();

    if (error || !user) throw new Error('Invalid credentials');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + (rememberMe ? 14 : 1) * 24 * 60 * 60 * 1000);

    await supabase.from('sessions').insert([{ user_id: user.id, token, expires_at: expiresAt }]);

    return { token, expiresIn: rememberMe ? '14d' : '24h' };
}

