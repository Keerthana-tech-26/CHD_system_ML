const Diagnosis = require("../models/Diagnosis");
const Chat = require("../models/Chat");
const axios = require("axios");
const fetch = require("node-fetch");

exports.getChatHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const chatDoc = await Chat.findOne({ patientId });
    
    if (!chatDoc || !chatDoc.conversation.length) {
      return res.status(200).json([]);
    }
    const formattedHistory = [];
    
    chatDoc.conversation.forEach((msg, index) => {
      if (msg.role === 'user') {
        const nextMsg = chatDoc.conversation[index + 1];
        if (nextMsg && nextMsg.role === 'assistant') {
          formattedHistory.push({
            message: msg.content,
            reply: nextMsg.content,
            createdAt: msg.timestamp,
            updatedAt: nextMsg.timestamp
          });
        }
      }
    });

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

exports.clearChatHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    await Chat.updateOne(
      { patientId },
      { 
        $set: { 
          conversation: [],
          lastActive: new Date()
        }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing chat history:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
};
const getRecentChatContext = async (patientId, limit = 6) => {
  try {
    const chatDoc = await Chat.findOne({ patientId });
    
    if (!chatDoc || !chatDoc.conversation.length) {
      return [];
    }
    const recentMessages = chatDoc.conversation.slice(-limit);
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
  } catch (error) {
    console.error("Error fetching recent chat context:", error);
    return [];
  }
};

exports.chatbotReply = async (req, res) => {
  const userMessage = req.body.message?.toLowerCase() || "";
  const context = req.body.context || null;
  const patientId = req.body.patientId || "unknown";

  if (!userMessage) {
    return res.status(400).json({ reply: "Please ask something!" });
  }

  let reply = "";

  try {
    if (userMessage.includes("risk") || userMessage.includes("predict")) {
      let prediction = null;
      let probability = null;
      let modelUsed = null;

      if (context && context.prediction !== undefined) {
        prediction = parseInt(context.prediction);
        modelUsed = context.model || "Unknown Model";
        probability = context.probability ?? 0.85;
      } else {
        const latestDiagnosis = await Diagnosis.findOne({ patientId }).sort({
          timestamp: -1,
        });

        if (latestDiagnosis) {
          prediction = parseInt(latestDiagnosis.prediction);
          modelUsed = latestDiagnosis.model || "Unknown Model";
          probability = latestDiagnosis.probability ?? 0.85;
        }
      }

      if (prediction === null) {
        reply = "📄 No diagnosis found yet. Please complete a prediction first.";
      } else if (prediction === 1) {
        reply =
          `⚠️ You may be at risk of coronary heart disease.\n` +
          `📊 Model: ${modelUsed}<br/>Confidence: ${(probability * 100).toFixed(1)}%\n\n` +
          `🩺 Recommendations:<br/>• Visit a cardiologist<br/>• Follow a heart-healthy diet<br/>• Exercise regularly<br/>• Avoid smoking/alcohol<br/>• Track blood pressure & cholesterol`;
      } else {
        reply =
          `✅ You are not at risk of CHD according to our latest prediction.\n` +
          `📊 Model: ${modelUsed}<br/>Confidence: ${(probability * 100).toFixed(1)}%\n\n` +
          `💡 Still, maintain a healthy lifestyle!`;
      }
    } 
    else {
      let aiReply = "";
      const recentContext = await getRecentChatContext(patientId, 6);
      const conversationMessages = [
        ...recentContext,
        { role: "user", content: req.body.message }
      ];
      let systemMessage = "You are a helpful health assistant. Provide accurate, supportive health information.";
      if (context && context.prediction !== undefined) {
        const riskStatus = parseInt(context.prediction) === 1 ? "at risk" : "not at risk";
        systemMessage += ` The patient is currently ${riskStatus} for coronary heart disease.`;
      }

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
              { role: "system", content: systemMessage },
              ...conversationMessages
            ],
            max_tokens: 500,
            temperature: 0.7
          }),
        });
        
        const data = await response.json();
        aiReply = data?.choices?.[0]?.message?.content;
        console.log("🔍 Used context messages:", conversationMessages.length);
      } 
      catch (openErr) {
        console.error("❌ OpenRouter failed, trying Gemini...");
        try {
          const geminiParts = conversationMessages.map(msg => ({
            text: `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
          }));
          
          geminiParts.unshift({ text: systemMessage });

          const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [{ parts: geminiParts }],
            }),
          });
          
          const geminiData = await geminiResponse.json();
          aiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          console.log("🔍 Used Gemini with context messages:", geminiParts.length);
        } 
        catch (geminiErr) {
          console.error("❌ Gemini also failed:", geminiErr);
        }
      }
      
      reply = aiReply || "⚠️ AI models are currently unavailable. Please try again later.";
    }
    await Chat.updateOne(
      { patientId },
      {
        $push: {
          conversation: [
            {
              role: 'user',
              content: req.body.message,
              timestamp: new Date()
            },
            {
              role: 'assistant',
              content: reply,
              timestamp: new Date()
            }
          ]
        },
        $set: { lastActive: new Date() }
      },
      { upsert: true }
    );

    res.json({ reply });

  } catch (error) {
    console.error("Chatbot error:", error.message);
    res.status(500).json({ reply: "⚠️ Error generating response. Please try again." });
  }
};
exports.getConversationStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const chatDoc = await Chat.findOne({ patientId });
    
    if (!chatDoc) {
      return res.status(404).json({ error: "No conversation found" });
    }

    const stats = {
      totalMessages: chatDoc.conversation.length,
      userMessages: chatDoc.conversation.filter(msg => msg.role === 'user').length,
      assistantMessages: chatDoc.conversation.filter(msg => msg.role === 'assistant').length,
      firstMessage: chatDoc.conversation[0]?.timestamp,
      lastMessage: chatDoc.conversation[chatDoc.conversation.length - 1]?.timestamp,
      lastActive: chatDoc.lastActive
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching conversation stats:", error);
    res.status(500).json({ error: "Failed to fetch conversation stats" });
  }
};