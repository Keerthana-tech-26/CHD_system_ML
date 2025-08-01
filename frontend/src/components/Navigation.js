import { Link } from "react-router-dom";

export default function Navigation() {
  const linkStyle = {
    color: "#1f2937",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "18px"
  };

  return (
    <nav style={{ 
      display: "flex", 
      gap: "20px", 
      padding: "10px", 
      backgroundColor: "#e2e8f0",
      justifyContent: "center" 
    }}>
      <Link to="/" style={linkStyle}>Diagnosis</Link>
      <Link to="/results" style={linkStyle}>Results</Link>
      <Link to="/history" style={linkStyle}>History</Link>
      <Link to="/chatbot" style={linkStyle}>Chatbot</Link>
    </nav>
  );
}
