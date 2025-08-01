import React, { useState, useEffect } from "react";
import {
  getChatHistory,
  sendChatMessage,
  getLatestDiagnosis,
  clearChatHistory,
} from "../services/api";
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [latestDiagnosis, setLatestDiagnosis] = useState(null);
  const [contextUsed, setContextUsed] = useState(false);
  const patientName = localStorage.getItem("currentPatientName") || localStorage.getItem("patientId");

  useEffect(() => {
    if (!patientName) {
      setMessages([
        {
          reply: "⚠️ No patient ID found. Please complete a diagnosis first.",
        },
      ]);
      return;
    }
    
    const fetchChatHistoryAndDiagnosis = async () => {
      try {
        const history = await getChatHistory(patientName);
        if (Array.isArray(history) && history.length > 0) {
          const formattedMessages = [];
          history.forEach(chat => {
            formattedMessages.push({ message: chat.message });
            formattedMessages.push({ reply: chat.reply });
          });
          setMessages(formattedMessages);
        } else {
          setMessages([]);
        }
      } catch (err) {
        setMessages([]);
      }
      
      try {
        const diagnosis = await getLatestDiagnosis(patientName);
        if (
          diagnosis &&
          (diagnosis.prediction !== undefined ||
            diagnosis.result !== undefined)
        ) {
          setLatestDiagnosis(diagnosis);
          setContextUsed(false);
        } else {
          setLatestDiagnosis(null);
        }
      } catch (err) {
        setLatestDiagnosis(null);
      }
    };
    
    fetchChatHistoryAndDiagnosis();
  }, [patientName]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    const newUserMessage = { message: userMessage };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInput("");

    if (!latestDiagnosis) {
      const reply = "⚠️ No diagnosis found for you yet. Please complete a prediction first.";
      setMessages(prevMessages => [...prevMessages, { reply }]);
      return;
    }

    try {
      const context = {
        prediction: latestDiagnosis.prediction ?? latestDiagnosis.result,
        model: latestDiagnosis.model || "unknown",
        probability: latestDiagnosis.probability,
      };

      const response = await fetch(
        `http://localhost:4000/api/chatbot/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            patientId: patientName,
            context,
          }),
        }
      );

      const data = await response.json();
      const botReply = { reply: data.reply || "⚠️ No response from bot." };
      setMessages(prevMessages => [...prevMessages, botReply]);

      if (!contextUsed) setContextUsed(true);
    } catch (err) {
      const errorReply = { reply: "⚠️ Something went wrong." };
      setMessages(prevMessages => [...prevMessages, errorReply]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleClearChat = async () => {
    if (!patientName) return;
    
    try {
      await clearChatHistory(patientName);
      setMessages([]);
    } catch (err) {
      alert("Failed to clear chat history. Please try again.");
    }
  };

  return (
    <div className="chatbot-container">
      <h2>💬 AI Health Assistant</h2>
      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>👋 Hello! Ask me about your heart disease risk.</p>
            <p>Try typing: "Am I at risk?"</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={`chat-${idx}`}
              className={`chat-bubble ${msg.message ? "user" : "bot"}`}
            >
              {msg.message && (
                <div className="user-message">{msg.message}</div>
              )}
              {msg.reply && (
                <div
                  className="bot-reply"
                  dangerouslySetInnerHTML={{
                    __html: msg.reply.replace(/\n/g, "<br/>"),
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask something..."
        />
        <button onClick={handleSendMessage} disabled={!input.trim()}>
          Send
        </button>
        <button onClick={handleClearChat} className="clear-btn">
          Clear Chat
        </button>
      </div>
    </div>
  );
};

export default Chatbot;