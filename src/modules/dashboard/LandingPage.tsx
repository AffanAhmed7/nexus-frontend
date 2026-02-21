import React, { useState, useEffect } from "react";
import { ArrowRight, Linkedin, Mail } from "lucide-react";
import { motion, useInView } from "framer-motion";
import LoginModal from "../auth/LoginModal";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/LandingPage.css";
import RegisterModal from "../auth/RegisterModal";
import "../../styles/RegisterModal.css";

const LandingPage = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);


    const navigate = useNavigate();

    // Navbar scroll effect & Hero Zoom
    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            const scrollPos = window.scrollY;
            setIsScrolled(scrollPos > 20);
            document.documentElement.style.setProperty('--scroll-y', `${scrollPos}`);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Scroll reveal animation & scroll progress
    useEffect(() => {
        const revealElements = document.querySelectorAll(".reveal");

        const onScroll = () => {
            revealElements.forEach((el) => {
                if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
                    el.classList.add("active");
                }
            });
        };

        window.addEventListener("scroll", onScroll);
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Smooth scrolling for anchors
    useEffect(() => {
        const smoothScroll = (target: HTMLElement, duration = 1000) => {
            const start = window.scrollY;
            const end = target.getBoundingClientRect().top + start - 70;
            const distance = end - start;
            let startTime: number | null = null;

            const easeInOutCubic = (t: number) =>
                t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                window.scrollTo(0, start + distance * easeInOutCubic(progress));
                if (timeElapsed < duration) requestAnimationFrame(animate);
            };

            requestAnimationFrame(animate);
        };

        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const targetId = (link as HTMLAnchorElement).getAttribute("href")!;
                const target = document.querySelector(targetId);
                if (!target || !(target instanceof HTMLElement)) return;
                smoothScroll(target, 1000);
            });
        });
    }, []);

    // LOCK SCROLL WHEN MODAL OPEN
    useEffect(() => {
        if (showLogin || showRegister) {
            document.body.classList.add("no-scroll");
            document.documentElement.classList.add("no-scroll");
        } else {
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll");
        }
        return () => {
            document.body.classList.remove("no-scroll");
            document.documentElement.classList.remove("no-scroll");
        };
    }, [showLogin, showRegister]);

    return (
        <>
            <div className="landing-page">

                {/* NAVBAR */}
                <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
                    <div className="navbar-inner">
                        <div className="logo">
                            NEXUS
                        </div>

                        {/* Sectional links removed for a cleaner aesthetic */}

                        <div className="nav-actions">
                            <button
                                className="nav-link"
                                onClick={() => setShowLogin(true)}
                            >
                                Login
                            </button>
                            <button
                                className="btn btn-primary hero-btn-fixed"
                                onClick={() => setShowRegister(true)}
                            >
                                Sign up
                            </button>
                        </div>
                    </div>
                </header>

                {/* HERO */}
                <section className="hero">
                    <div className="hero-background-wrapper">
                        <div
                            className="hero-background-image"
                            style={{
                                backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop')"
                            }}
                        />
                    </div>
                    <div className="container hero-content">
                        <p className="hero-eyebrow">Introducing Nexus</p>
                        <h1>
                            Build clarity.<br />
                            <span>Ship with confidence.</span>
                        </h1>
                        <p className="hero-subtitle">
                            The ultimate task management platform for modern teams.<br />
                            Streamline workflows. Increase productivity. Stay on track.
                        </p>
                        <div className="hero-actions">
                            <button
                                className="btn btn-primary hero-btn-fixed"
                                onClick={() => setShowRegister(true)}
                            >
                                Get Started
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </section>

                {/* STATS */}
                <section className="stats-section reveal">
                    <div className="container stats-grid">
                        <div className="stat-item">
                            <h3>Real-time</h3>
                            <p>WebSocket-powered collaboration</p>
                        </div>
                        <div className="stat-item">
                            <h3>Secure</h3>
                            <p>Enterprise-grade encryption</p>
                        </div>
                        <div className="stat-item">
                            <h3>Scalable</h3>
                            <p>Built for teams of any size</p>
                        </div>
                        <div className="stat-item">
                            <h3>Modern</h3>
                            <p>Cutting-edge tech stack</p>
                        </div>
                    </div>
                </section>

                {/* FEATURES INTRO */}
                <section className="features-intro container reveal">
                    <h2>Everything you need.<br />Nothing you don't.</h2>
                    <p>Powerful features designed to help your team work smarter, not harder.</p>
                </section>

                {/* FEATURES */}
                <section id="features" className="features container">
                    <FeatureCard
                        img="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&auto=format&fit=crop"
                        title="Kanban Boards"
                        text="Visualize your workflow effortlessly. Drag and drop tasks, assign priorities, track deadlines, and maintain full activity history."
                    />
                    <FeatureCard
                        img="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600&auto=format&fit=crop"
                        title="Live Collaboration"
                        text="Work together in real-time with WebSocket-powered updates. Team members see changes instantly, reducing conflicts and improving communication."
                    />
                    <FeatureCard
                        img="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop"
                        title="Control & Insights"
                        text="Gain full transparency with role-based permissions, detailed audit logs, global search, and analytics dashboards."
                    />
                </section>

                {/* WORKFLOW */}
                <section id="workflow" className="workflow-section reveal">
                    <div className="container workflow-content">
                        <div className="workflow-text">
                            <h2>Designed like a real SaaS product</h2>
                            <p>
                                Nexus mirrors professional SaaS workflows, combining security, scalability, and simplicity. Teams can collaborate effectively across multiple boards, ensuring clarity and productivity.
                            </p>
                            <p>
                                Every workflow component is crafted to simulate enterprise-grade operations. Customize your workspace, manage multiple projects simultaneously, and track progress with actionable insights.
                            </p>
                        </div>
                        <div className="workflow-visual">
                            <div className="workflow-card">
                                <div className="workflow-icon-wrapper">
                                    <svg className="workflow-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M2 17L12 22L22 17" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M2 12L12 17L22 12" stroke="url(#gradient1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h4>Create</h4>
                                <p>Set up workspaces and projects</p>
                            </div>
                            <div className="workflow-card">
                                <div className="workflow-icon-wrapper">
                                    <svg className="workflow-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#ec4899" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="12" cy="12" r="10" stroke="url(#gradient2)" strokeWidth="2" />
                                        <circle cx="12" cy="12" r="6" stroke="url(#gradient2)" strokeWidth="2" />
                                        <circle cx="12" cy="12" r="2" fill="url(#gradient2)" />
                                    </svg>
                                </div>
                                <h4>Organize</h4>
                                <p>Structure tasks and priorities</p>
                            </div>
                            <div className="workflow-card">
                                <div className="workflow-icon-wrapper">
                                    <svg className="workflow-icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#22d3ee" />
                                                <stop offset="100%" stopColor="#10b981" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M4.5 16.5C3 14 3 11.5 3 9C3 5.5 5.5 3 9 3C11.5 3 14 3 16.5 4.5" stroke="url(#gradient3)" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M14.5 4.5L21 3L19.5 9.5M19.5 9.5L13 11M19.5 9.5L13 16" stroke="url(#gradient3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h4>Execute</h4>
                                <p>Collaborate and deliver</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CINEMATIC SHOWCASE SECTION */}
                <section id="details" className="showcase-section">
                    <div className="container">
                        <div className="showcase-header reveal">
                            <span className="showcase-eyebrow">Enterprise Features</span>
                            <h2>Scale without limits.</h2>
                            <p>Everything you need to manage complex projects at speed.</p>
                        </div>

                        <div className="showcase-list">
                            <ShowcaseItem
                                title="Structured Workspaces"
                                eyebrow="Organization"
                                text="Nexus offers multi-level nesting for your projects. Group boards by department, project phase, or team velocity. Full isolation with shared visibility."
                                img="https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1200&auto=format&fit=crop"
                            />
                            <ShowcaseItem
                                title="Advanced Task Lifecycle"
                                eyebrow="Productivity"
                                text="Track every state transition. From intake to archive, Nexus provides detailed audit logs, custom status flows, and dynamic task relationships."
                                img="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop"
                                reverse
                            />
                            <ShowcaseItem
                                title="Security & Governance"
                                eyebrow="Enterprise"
                                text="Fine-grained RBAC, session management, and JWT-powered authentication ensure your data stays within the perimeter. Built for compliance-heavy environments."
                                img="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
                            />
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="footer">
                    <div className="footer-top">
                        <div className="footer-brand">
                            NEXUS
                            <p>Modern project management for focused teams.</p>
                        </div>
                        <div className="footer-links">
                            <a href="https://www.linkedin.com/in/affan-ahmed-885735298?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer"><Linkedin /></a>
                            <a href="https://mail.google.com/mail/?view=cm&to=affanahmedkhan34@gmail.com" target="_blank" rel="noopener noreferrer"><Mail /></a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        © {new Date().getFullYear()} Nexus. All rights reserved.
                    </div>
                </footer>
            </div>

            {/* 🔑 MODALS MOVED OUTSIDE LANDING-PAGE (FIX) */}
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
        </>
    );
};

const FeatureCard = React.memo(({ img, title, text }: any) => (
    <div className="feature-card reveal">
        <img src={img} alt={title} loading="lazy" />
        <h3>{title}</h3>
        <p>{text}</p>
    </div>
));

const MockBrowser = ({ children }: { children: React.ReactNode }) => (
    <div className="mock-browser">
        <div className="browser-header">
            <div className="browser-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
            </div>
            <div className="browser-address">nexus.app</div>
        </div>
        <div className="browser-content">
            {children}
        </div>
    </div>
);

const ShowcaseItem = React.memo(({ eyebrow, title, text, img, reverse }: any) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <div ref={ref} className={`showcase-item ${reverse ? 'reverse' : ''}`}>
            <motion.div
                className="showcase-content"
                initial={{ opacity: 0, x: reverse ? 50 : -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="feature-badge">{eyebrow}</div>
                <h3>{title}</h3>
                <p>{text}</p>
            </motion.div>

            <motion.div
                className="showcase-visual"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
                <img src={img} alt={title} loading="lazy" />
                <div className="visual-overlay"></div>
            </motion.div>
        </div>
    );
});

export default LandingPage;
