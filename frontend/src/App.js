import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DiagnosisForm from "./components/DiagnosisForm";
import Chatbot from "./components/Chatbot";
import ResultsDisplay from "./components/ResultsDisplay";
import Navigation from "./components/Navigation";
import PatientHistory from "./components/PatientHistory";
import "./styles/globals.css";
function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<DiagnosisForm />} />
        <Route path="/results" element={<ResultsDisplay />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/history" element={<PatientHistory />} />
      </Routes>
    </Router>
  );
}
export default App;
