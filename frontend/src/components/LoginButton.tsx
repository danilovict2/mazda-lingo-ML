import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
export default function LoginButton({ returnTo = "/dashboard" }: { returnTo?: string }) {
    const { loginWithRedirect } = useAuth0();
    const [error, setError] = useState(false);
    return <><button className="button login" onClick={() => { setError(false); void loginWithRedirect({ appState: { returnTo } }).catch(() => setError(true)); }}>Log in</button>{error && <p role="alert">Unable to start login. Please try again.</p>}</>;
}
