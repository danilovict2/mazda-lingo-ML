import { Link } from "react-router-dom";
import { AudioLines } from "lucide-react";

export function Logo() {
    return (
        <Link to="/" className="logo">
            <span className="logo-mark">
                <AudioLines size={25} />
            </span>
            lingo<span className="logo-dot">.</span>
        </Link>
    );
}