import { supabase } from './utils/supabaseClient';
import bcrypt from 'bcryptjs';
//import { sendVerificationEmail } from './utils/emailService';
import { v4 as uuidv4 } from 'uuid';


export async function sendVerificationEmail(email, code) {
    try {
        const response = await fetch('http://wirecracker-versel.vercel.app:5000/send-verification-email', {
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
    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
        .from('users')
        .insert([{ email, name, password_hash: hashedPassword }])
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
        .single();

    if (error || !user) throw new Error('Invalid credentials');

    // Verify the password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) throw new Error('Invalid credentials');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + (rememberMe ? 14 : 1) * 24 * 60 * 60 * 1000);

    await supabase.from('sessions').insert([{ user_id: user.id, token, expires_at: expiresAt }]);

    return { token, expiresIn: rememberMe ? '14d' : '24h' };
}

