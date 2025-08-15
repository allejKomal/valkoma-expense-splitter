// src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = "https://pvalkoma-gist.vercel.app";

export default function AuthCallback() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (!code) {
                setError("Missing code in URL");
                return;
            }

            try {
                const res = await axios.post(`${BACKEND_URL}/api/auth-callback`, {
                    code,
                });

                const token = res.data?.access_token;
                if (!token) throw new Error("No access_token returned");

                sessionStorage.setItem("gh_token", token);

                // Redirect back to home after storing token
                window.location.replace("/");
            } catch (err: any) {
                setError(err.message || "Token exchange failed");
            }
        })();
    }, []);

    if (error) return <div>Auth failed: {error}</div>;
    return <div>Authorizing…</div>;
}
