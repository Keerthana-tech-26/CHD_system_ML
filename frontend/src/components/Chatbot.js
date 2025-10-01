import React, { useState, useEffect, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const chatWindowRef = useRef(null);
  const patientName = localStorage.getItem("currentPatientName") || localStorage.getItem("patientId");

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!patientName) {
      console.warn("⚠️ No patient name found in localStorage.");
      setMessages([
        {
          reply: "⚠️ No patient ID found. Please complete a diagnosis first.",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    const fetchChatHistoryAndDiagnosis = async () => {
      setIsLoading(true);

      try {
        console.log("🔍 Fetching chat history for patient:", patientName);
        const history = await getChatHistory(patientName);
        console.log("📨 Fetched chat history:", history);

        if (Array.isArray(history) && history.length > 0) {
          const formattedMessages = [];
          history.forEach((chat, index) => {
            formattedMessages.push({ 
              message: chat.message,
              timestamp: chat.createdAt,
              id: `user-${index}` 
            });
            formattedMessages.push({ 
              reply: chat.reply,
              timestamp: chat.createdAt,
              id: `bot-${index}`,
              isComplete: true 
            });
          });
          setMessages(formattedMessages);
          console.log("✅ Chat history loaded successfully:", formattedMessages.length, "messages");
        } else {
          console.log("🔭 No chat history found, starting with empty messages");
          setMessages([]);
        }
      } catch (err) {
        console.error("❌ Failed to load chat history:", err);
        setMessages([]);
      }

      try {
        console.log("🔍 Fetching latest diagnosis for patient:", patientName);
        const diagnosis = await getLatestDiagnosis(patientName);
        console.log("🩺 Latest diagnosis:", diagnosis);

        if (diagnosis && (diagnosis.prediction !== undefined || diagnosis.result !== undefined)) {
          setLatestDiagnosis(diagnosis);
          setContextUsed(false);
          console.log("✅ Latest diagnosis loaded successfully");
        } else {
          console.log("🔭 No diagnosis found");
          setLatestDiagnosis(null);
        }
      } catch (err) {
        console.error("❌ Failed to fetch latest diagnosis:", err);
        setLatestDiagnosis(null);
      }

      setIsLoading(false);
    };

    fetchChatHistoryAndDiagnosis();
  }, [patientName]);

  const typeMessage = (fullMessage, messageId) => {
    let currentText = "";
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < fullMessage.length) {
        currentText += fullMessage[charIndex];
        
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, reply: currentText, isTyping: true }
              : msg
          )
        );
        
        charIndex++;
      } else {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, reply: fullMessage, isTyping: false, isComplete: true }
              : msg
          )
        );
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 30);
    return typeInterval;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const timestamp = new Date();

    const newUserMessage = { 
      message: userMessage, 
      timestamp,
      id: `user-${Date.now()}`
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInput("");
    
    const botMessageId = `bot-${Date.now()}`;
    const emptyBotMessage = {
      reply: "",
      timestamp: new Date(),
      id: botMessageId,
      isTyping: true,
      isComplete: false
    };
    
    setMessages(prevMessages => [...prevMessages, emptyBotMessage]);
    setIsTyping(true);

    try {
      let context = null;

      if (latestDiagnosis) {
        context = {
          prediction: latestDiagnosis.prediction ?? latestDiagnosis.result,
          model: latestDiagnosis.model || "unknown",
          probability: latestDiagnosis.probability,
        };
      }

      const response = await fetch(`http://localhost:4000/api/chatbot/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          patientId: patientName,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("🤖 Bot response:", data);
      const fullReply = data.reply || "⚠️ No response from bot.";
      typeMessage(fullReply, botMessageId);

      if (!contextUsed && latestDiagnosis) setContextUsed(true);

    } catch (err) {
      console.error("❌ Chatbot error:", err);
      const errorReply = "⚠️ Something went wrong. Please try again."; 
      typeMessage(errorReply, botMessageId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (!patientName) {
      alert("No patient ID found. Cannot clear chat history.");
      return;
    }

    const confirmClear = window.confirm("Are you sure you want to clear all chat history? This action cannot be undone.");
    if (!confirmClear) return;

    try {
      console.log("🗑️ Clearing chat history for patient:", patientName);
      const result = await clearChatHistory(patientName);
      console.log("✅ Clear chat result:", result);

      if (result.success) {
        setMessages([]);
        console.log("✅ Chat history cleared successfully");

        setMessages([{
          reply: "✅ Chat history cleared successfully!",
          timestamp: new Date(),
          id: "clear-success",
          isComplete: true
        }]);

        setTimeout(() => {
          setMessages([]);
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to clear chat history");
      }
    } catch (err) {
      console.error("❌ Failed to clear chat history:", err);
      alert("Failed to clear chat history. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="chatbot-container">
        <h2>💬 AI Health Assistant</h2>
        <div className="chat-window">
          <div className="loading">
            <p>📄 Loading chat history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <h2>💬 AI Health Assistant</h2>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>👋 Hello! Ask me about your heart disease risk.</p>
            <p>Try typing: "Am I at risk?"</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || `chat-${idx}`}
              className={`chat-bubble ${msg.message ? "user" : "bot"}`}
            >
              {msg.message && (
                <div className="user-message">{msg.message}</div>
              )}
              {(msg.reply || msg.reply === "") && (
                <>
                  <div
                    className="bot-reply"
                    dangerouslySetInnerHTML={{
                      __html: msg.reply.replace(/\n/g, "<br/>") + (msg.isTyping ? '<span class="typing-cursor">|</span>' : '')
                    }}
                  />
                  {msg.timestamp && (
                    <div className="message-timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                      {msg.isComplete && (
                        <span className="model-attribution"> • Gemini AI</span>
                      )}
                    </div>
                  )}
                </>
              )}
              {msg.message && msg.timestamp && (
                <div className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
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
          placeholder={isTyping ? "AI is typing..." : "Ask something..."}
          disabled={isLoading || isTyping}
        />
        <button 
          onClick={handleSendMessage} 
          disabled={!input.trim() || isLoading || isTyping}
        >
          {isTyping ? "..." : "Send"}
        </button>
        <button 
          onClick={handleClearChat} 
          className="clear-btn"
          disabled={isLoading || isTyping}
        >
          Clear Chat
        </button>
      </div>
      {patientName && (
        <div className="patient-info">
          <small>Patient: {patientName}</small>
        </div>
      )}
    </div>
  );
};

export default Chatbot;