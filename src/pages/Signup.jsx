import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, verifyEmail } from '../auth';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async () => {
        try {
            await signUp(email, name, password);
            setIsVerifying(true);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleVerify = async () => {
        try {
            await verifyEmail(email, code);
            alert('Verification successful! You can log in now.');
            navigate('/login');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div>
            {!isVerifying ? (
                <>
                    <h2>Sign Up</h2>
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={handleSignup}>Sign Up</button>
                </>
            ) : (
                <>
                    <h2>Verify Email</h2>
                    <input type="text" placeholder="Enter Verification Code" value={code} onChange={(e) => setCode(e.target.value)} />
                    <button onClick={handleVerify}>Verify</button>
                </>
            )}
        </div>
    );
};

export default Signup;
