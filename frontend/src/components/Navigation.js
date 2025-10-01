import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Diagnosis" },
    { path: "/results", label: "Results" },
    { path: "/history", label: "History" },
    { path: "/chatbot", label: "AI Assistant" }
  ];

  return (
    <nav style={{ 
      padding: '1rem', 
      backgroundColor: '#f5f5f5', 
      borderBottom: '1px solid #ddd',
      display: 'flex',
      gap: '2rem',
      alignItems: 'center'
    }}>
      <div style={{ fontWeight: 'bold' }}>CardioAI</div>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path} 
            style={{
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              color: location.pathname === item.path ? '#007bff' : '#333',
              backgroundColor: location.pathname === item.path ? '#e7f3ff' : 'transparent',
              borderRadius: '4px'
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      
      <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#666' }}>
        System Online
      </div>
    </nav>
  );
}