import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { setTokenProvider } from "../api/client";
import { ProgressProvider } from "../state/ProgressProvider";
import LoginButton from "../components/LoginButton";

const env = (import.meta as unknown as { env: Record<string, string> }).env;
export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const domain = env.VITE_AUTH0_DOMAIN?.trim();
    if (!domain || domain.includes(":") || domain.includes("/") || !env.VITE_AUTH0_CLIENT_ID || !env.VITE_AUTH0_AUDIENCE) {
        return <main className="auth-screen"><h1>Authentication needs configuration</h1><p>Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE in frontend/.env.local, then restart Vite. See AUTH0.md.</p></main>;
    }
    return <Auth0Provider domain={domain} clientId={env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{ redirect_uri: window.location.origin, audience: env.VITE_AUTH0_AUDIENCE, scope: "openid profile email" }}
        onRedirectCallback={(state) => {
            const target = state?.returnTo;
            navigate(typeof target === "string" && target.startsWith("/") && !target.startsWith("//") && !target.includes("\\") ? target : "/dashboard", { replace: true });
        }}>
        <TokenBridge>{children}</TokenBridge>
    </Auth0Provider>;
}
function TokenBridge({ children }: { children: ReactNode }) {
    const { getAccessTokenSilently, isLoading, error } = useAuth0();
    const [ready, setReady] = useState(false);
    useEffect(() => {
        setTokenProvider(async () => {
            const token = await getAccessTokenSilently();
            if (!token) throw new Error("Please sign in again.");
            return token;
        });
        setReady(true);
        return () => setTokenProvider(null);
    }, [getAccessTokenSilently]);
    if (error) return <main className="auth-screen" role="alert"><h1>Unable to sign in</h1><p>{error.message}</p><a href="/">Try again</a></main>;
    if (isLoading || !ready) return <main className="auth-screen" role="status">Loading your account…</main>;
    return children;
}
export function RequireAuth() {
    const { isAuthenticated, user } = useAuth0();
    const location = useLocation();
    if (!isAuthenticated) return <main className="auth-screen"><h1>Sign in to start practicing</h1><LoginButton returnTo={location.pathname + location.search + location.hash} /></main>;
    return <ProgressProvider key={user!.sub} userId={user!.sub!}><Outlet /></ProgressProvider>;
}
