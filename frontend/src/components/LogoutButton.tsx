import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";

export default function LogoutButton() {
    const { logout } = useAuth0();
    const [error, setError] = useState(false);
    return <>
        <button onClick={() => {
            setError(false);
            void logout({ logoutParams: { returnTo: window.location.origin } }).catch(() => setError(true));
        }} className="button logout">Log out</button>
        {error && <p role="alert">Unable to log out. Please try again.</p>}
    </>;
}
