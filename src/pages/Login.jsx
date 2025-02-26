import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const { token } = await login(email, password, rememberMe);
            localStorage.setItem('token', token);
            alert('Login successful');
            navigate('/');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label>
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                Remember Me
            </label>
            <button onClick={handleLogin}>Login</button>
        </div>
    );
};

export default Login;
