import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navigation() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: "Diagnosis", icon: "🏥" },
    { path: "/results", label: "Results", icon: "📊" },
    { path: "/history", label: "History", icon: "📋" },
    { path: "/chatbot", label: "AI Assistant", icon: "🤖" }
  ];

  return (
    <nav className={`modern-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {}
        <div className="nav-brand">
          <div className="brand-icon">❤️</div>
          <div className="brand-text">
            <span className="brand-name">CardioAI</span>
            <span className="brand-subtitle">CHD Diagnosis</span>
          </div>
        </div>

        {}
        <div className="nav-links">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              {location.pathname === item.path && <div className="active-indicator" />}
            </Link>
          ))}
        </div>

        {}
        <div className="nav-status">
          <div className="status-indicator online"></div>
          <span className="status-text">System Online</span>
        </div>
      </div>
    </nav>
  );
}