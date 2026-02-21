import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_FEATURES = [
    { label: "Dashboard", path: "/" },
    { label: "Vehicles", path: "/vehicles" },
    { label: "Drivers", path: "/drivers" },
    { label: "Trips", path: "/trips" },
    { label: "Maintenance", path: "/maintenance" },
    { label: "Fuel Logs", path: "/fuel" },
    { label: "Reports", path: "/reports" },
];

const FEATURES_DATA = [
    {
        title: "Command Center",
        desc: 'High-level oversight with KPIs for active fleets, utilization rates, and pending cargo.',
        color: "#2E4AE5", 
        delay: 0
    },
    {
        title: "Vehicle Registry",
        desc: "Manage physical assets, tracking max load capacities, odometers, and lifecycle status.",
        color: "#2E4AE5",
        delay: 0.1
    },
    {
        title: "Safety Profiles",
        desc: "Monitor drivers, track safety scores, and block assignments if licenses are expired.",
        color: "#2E4AE5",
        delay: 0.2
    },
    {
        title: "Trip Dispatcher",
        desc: "Manage workflows for moving goods, featuring automated validation rules based on cargo weight.",
        color: "#2E4AE5",
        delay: 0.3
    },
    {
        title: "Maintenance Logs",
        desc: 'Track preventative health; automatically switches status to "In Shop" to prevent dispatching.',
        color: "#2E4AE5",
        delay: 0.4
    },
    {
        title: "Expense & Fuel Logging",
        desc: "Record liters, cost, and date to calculate Total Operational Cost per asset.",
        color: "#2E4AE5",
        delay: 0.5
    },
    {
        title: "Operational Analytics",
        desc: "Audit operational costs, track vehicle ROI, and export one-click CSV/PDF reports.",
        color: "#2E4AE5",
        delay: 0.6
    },
];

export default function LandingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const handleNav = () => {
        if (user) navigate("/dashboard");
        else navigate("/login");
    };

    return (
        <div style={{ minHeight: "100vh", width: "100%", overflowX: "hidden", backgroundColor: "#f8f9fa", fontFamily: 'Inter, sans-serif' }}>
            
            {/* Top Blue Hero Section */}
            <div style={{
                position: "relative",
                background: "linear-gradient(135deg, #2441e7 0%, #1b30ab 100%)",
                overflow: "hidden",
                minHeight: "auto"
            }}>
                
                {/* Floating Background Circles */}
                <FloatingCircle size={300} top="10%" left="-5%" opacity={0.1} duration={20} />
                <FloatingCircle size={200} top="60%" left="10%" opacity={0.08} duration={25} delay={2} />
                <FloatingCircle size={150} top="20%" right="15%" opacity={0.1} duration={18} delay={1} />
                <FloatingCircle size={100} bottom="20%" right="5%" opacity={0.12} duration={22} delay={3} />
                
                {/* Navbar */}
                <nav style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "24px 48px", position: "relative", zIndex: 10 }}>
                    <div style={{ marginRight: "24px", display: "flex", alignItems: "center", height: "100%" }}>
                        <Dropdown label="Services" items={NAV_FEATURES} onSelect={handleNav} />
                    </div>
                    <button
                        style={{
                            background: "transparent",
                            color: "#fff",
                            border: "2px solid rgba(255,255,255,0.4)", // Slightly thicker border
                            borderRadius: "10px",
                            padding: "12px 32px", // Increased padding
                            fontWeight: 600,
                            fontSize: "1.15rem", // Increased font size
                            cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", // Snappier transition
                            backdropFilter: "blur(10px)",
                            transform: "translateY(0) scale(1)",
                            boxShadow: "0 0 0 rgba(0,0,0,0)"
                        }}
                        onClick={handleNav}
                        onMouseEnter={(e) => {
                            e.target.style.background = "rgba(255,255,255,0.15)";
                            e.target.style.borderColor = "rgba(255,255,255,0.8)";
                            e.target.style.transform = "translateY(-2px)"; // Float up effect
                            e.target.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)"; // Drop shadow on hover
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "transparent";
                            e.target.style.borderColor = "rgba(255,255,255,0.4)";
                            e.target.style.transform = "translateY(0) scale(1)";
                            e.target.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
                        }}
                        onMouseDown={(e) => {
                            // Click press-down effect
                            e.target.style.transform = "translateY(1px) scale(0.96)";
                            e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                        }}
                        onMouseUp={(e) => {
                            // Pop back up to hover state
                            e.target.style.transform = "translateY(-2px) scale(1)";
                            e.target.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
                        }}
                    >Login</button>
                </nav>

                {/* Hero Content */}
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "flex-start", 
                    padding: "60px 80px 200px 80px", 
                    position: "relative", 
                    zIndex: 2 
                }}>
                    <div style={{ color: "#fff", textAlign: "left", maxWidth: "700px" }}>
                        <h1 style={{ 
                            fontSize: "3.5rem", 
                            fontWeight: 800, 
                            marginBottom: "24px", 
                            lineHeight: "1.2",
                            animation: "fadeInUp 0.8s ease-out"
                        }}>
                            FleetFlow: Modular Fleet & Logistics Management System
                        </h1>
                        <p style={{ 
                            fontSize: "1.25rem", 
                            fontWeight: 400, 
                            color: "#e0e7ff", 
                            lineHeight: "1.6",
                            animation: "fadeInUp 0.8s ease-out 0.2s both"
                        }}>
                            Replace inefficient, manual logbooks with a centralized, rule-based digital hub. Optimize the lifecycle of your delivery fleet, monitor driver safety, and track financial performance in real-time.
                        </p>
                    </div>
                </div>

                {/* Additional deeper wave layer for depth (Animated Parallax) */}
                <div style={{
                    position: "absolute",
                    bottom: "-1px",
                    left: 0,
                    width: "200%",
                    height: "220px",
                    display: "flex",
                    zIndex: 0,
                    opacity: 0.5,
                    animation: "moveWave 20s linear infinite"
                }}>
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: "50%", height: "100%" }}>
                        <path fill="#c7d2fe" d="M0,160 C240,80, 480,80, 720,160 C960,240, 1200,240, 1440,160 L1440,320 L0,320 Z"></path>
                    </svg>
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: "50%", height: "100%" }}>
                        <path fill="#c7d2fe" d="M0,160 C240,80, 480,80, 720,160 C960,240, 1200,240, 1440,160 L1440,320 L0,320 Z"></path>
                    </svg>
                </div>

                {/* Front White Wave (Animated Parallax) */}
                <div style={{
                    position: "absolute",
                    bottom: "-1px",
                    left: 0,
                    width: "200%",
                    height: "180px",
                    display: "flex",
                    zIndex: 1,
                    animation: "moveWave 12s linear infinite" 
                }}>
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: "50%", height: "100%" }}>
                        <path fill="#ffffff" d="M0,128 C240,224, 480,224, 720,128 C960,32, 1200,32, 1440,128 L1440,320 L0,320 Z"></path>
                    </svg>
                    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ width: "50%", height: "100%" }}>
                        <path fill="#ffffff" d="M0,128 C240,224, 480,224, 720,128 C960,32, 1200,32, 1440,128 L1440,320 L0,320 Z"></path>
                    </svg>
                </div>
            </div>

            {/* Marquee Features Section */}
            <section style={{ 
                background: "transparent", 
                padding: "40px 0 120px 0",
                position: "relative",
                marginTop: "-117px", 
                overflow: "visible", 
                zIndex: 10 
            }}>
                <div className="marquee-container">
                    {[...FEATURES_DATA, ...FEATURES_DATA].map((feature, index) => (
                        <FloatingFeatureCircle 
                            key={index}
                            title={feature.title}
                            desc={feature.desc}
                            color={feature.color}
                            delay={feature.delay}
                        />
                    ))}
                </div>
            </section>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-20px) rotate(2deg);
                    }
                }

                @keyframes marqueeRight {
                    0% {
                        transform: translateX(-50%);
                    }
                    100% {
                        transform: translateX(0);
                    }
                }

                @keyframes moveWave {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                .marquee-container {
                    display: flex;
                    width: max-content;
                    gap: 40px;
                    padding: 20px 20px 60px 20px; 
                    animation: marqueeRight 45s linear infinite;
                    position: relative;
                    z-index: 3;
                }

                .marquee-container:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}

function FloatingCircle({ size, top, left, right, bottom, opacity, duration = 20, delay = 0 }) {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
                top: top,
                left: left,
                right: right,
                bottom: bottom,
                opacity: opacity,
                animation: mounted ? `float ${duration}s ease-in-out infinite` : 'none',
                animationDelay: `${delay}s`,
                pointerEvents: "none",
                zIndex: 1
            }}
        />
    );
}

function FloatingFeatureCircle({ title, desc, color, delay }) {
    const [isHovered, setIsHovered] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            style={{
                width: "280px",
                height: "280px",
                flexShrink: 0, 
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${color} 0%, #1c2ba6 100%)`, 
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
                textAlign: "center",
                boxShadow: isHovered 
                    ? "0 25px 50px rgba(32, 56, 196, 0.4)" 
                    : "0 15px 35px rgba(32, 56, 196, 0.15)",
                transform: mounted 
                    ? isHovered 
                        ? "translateY(-15px) scale(1.08)" 
                        : "translateY(0) scale(1)" 
                    : "translateY(50px) scale(0.8)",
                opacity: mounted ? 1 : 0,
                transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.1)",
                animation: mounted && !isHovered ? `float 6s ease-in-out infinite` : 'none',
                animationDelay: `${delay}s`
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <h3 style={{ 
                fontSize: "1.3rem", 
                fontWeight: 700, 
                marginBottom: "12px", 
                color: "#ffffff", 
                lineHeight: "1.3"
            }}>
                {title}
            </h3>
            <p style={{ 
                fontSize: "0.9rem", 
                color: "rgba(255,255,255,0.9)", 
                lineHeight: "1.5",
                maxWidth: "200px"
            }}>
                {desc}
            </p>
            
            <div style={{
                position: "absolute",
                bottom: "25px",
                width: "40px",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(255, 255, 255, 0.6)", 
                transform: isHovered ? "scaleX(1.5)" : "scaleX(1)",
                transition: "transform 0.3s ease"
            }} />
        </div>
    );
}

function Dropdown({ label, items, onSelect }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            style={{ position: "relative" }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                style={{
                    background: "transparent",
                    color: "#fff",
                    border: "none",
                    padding: "10px",
                    fontWeight: 600, // Slightly bolder to match the login button
                    fontSize: "1.15rem", // Increased font size
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    transition: "opacity 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                onMouseLeave={(e) => e.target.style.opacity = "1"}
            >
                {label}
                <span style={{
                    marginLeft: 6,
                    fontSize: "0.75em",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease"
                }}>▼</span>
            </button>
            <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                paddingTop: "15px",
                opacity: open ? 1 : 0,
                visibility: open ? "visible" : "hidden",
                transform: open ? "translateY(0)" : "translateY(-10px)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                transformOrigin: "top right"
            }}>
                <div style={{
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                    minWidth: "200px",
                    padding: "12px 0",
                }}>
                    {items.map((item) => (
                        <div
                            key={item.label}
                            style={{
                                display: "block",
                                padding: "12px 24px",
                                color: "#334155",
                                textDecoration: "none",
                                fontWeight: 500,
                                transition: "background 0.2s ease",
                                cursor: "pointer"
                            }}
                            onClick={onSelect}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}