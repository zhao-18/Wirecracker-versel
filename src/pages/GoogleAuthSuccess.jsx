import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function GoogleAuthSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (token) {
            localStorage.setItem("token", token);
        }

        // Redirect to homepage
        navigate("/");
    }, [navigate]);

    return <p>Signing in...</p>;
}

export default GoogleAuthSuccess;
