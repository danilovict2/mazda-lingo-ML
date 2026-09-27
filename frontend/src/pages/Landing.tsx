import LoginButton from "../components/LoginButton";
import { Link } from "react-router-dom";
import { AudioLines, ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { Logo } from "../components/Logo";
import { Button } from "../components/Button";
import { Wave } from "../components/Wave";

export function Landing() {
    return (
        <div className="landing">
            <header>
                <Logo />
                <nav>
                    <LoginButton />
                    <a href="#how">How it works</a>
                    <Link to="/progress">The speech profile</Link>
                    <Link to="/dashboard" className="text-link">
                        Explore demo <ArrowUpRight size={16} />
                    </Link>
                </nav>
            </header>
            <section className="landing-hero">
                <div>
                    <span className="eyebrow">
                        <span className="tiny-dot" /> A NEW WAY TO FIND YOUR VOICE
                    </span>
                    <h1>
                        Good English.
                        <br />
                        <span>Great rhythm.</span>
                    </h1>
                    <p>
                        It’s not just what you say. It’s how you say it.
                        <br />
                        Find the stress, feel the rhythm, and speak English with a little
                        more confidence.
                    </p>
                    <div className="actions">
                        <Button to="/placement">
                            Find my starting level <ArrowRight size={18} />
                        </Button>
                        <Button to="/dashboard" secondary>
                            Explore the demo
                        </Button>
                    </div>
                    <div className="landing-note">
                        <Check size={15} /> 2-minute placement <span>•</span> Sign in to practice <span>•</span> Your pace
                    </div>
                </div>
                <div className="hero-art">
                    <div className="art-top">
                        <span>
                            <i /> YOUR VOICE HAS A RHYTHM
                        </span>
                        <AudioLines size={22} />
                    </div>
                    <div className="art-sentence">
                        Make yourself
                        <br />
                        <em>heard.</em>
                    </div>
                    <Wave active />
                    <div className="art-bottom">
                        <span>Clarity meets confidence.</span>
                        <span className="play-circle">
                            <Play size={17} fill="currentColor" />
                        </span>
                    </div>
                    <div className="floating-note">
                        <span className="check-circle">
                            <Check size={17} />
                        </span>
                        <div>
                            <strong>That’s your rhythm.</strong>
                            <small>One small practice. One step forward.</small>
                        </div>
                    </div>
                </div>
            </section>
            <section id="how" className="landing-features">
                {[
                    {
                        n: "01",
                        title: "Find your starting point",
                        text: "A quick check-in meets you where your English is today.",
                    },
                    {
                        n: "02",
                        title: "Play with your pronunciation",
                        text: "Seven bite-sized games. Real conversation. Instant insight.",
                    },
                    {
                        n: "03",
                        title: "See your voice grow",
                        text: "Your personal speech profile makes every little win visible.",
                    },
                ].map((f) => (
                    <div key={f.n}>
                        <span>{f.n}</span>
                        <h3>{f.title}</h3>
                        <p>{f.text}</p>
                    </div>
                ))}
            </section>
            <div className="landing-footer">
                <AudioLines size={18} /> Small steps. Stronger speech.
            </div>
        </div>
    );
}
