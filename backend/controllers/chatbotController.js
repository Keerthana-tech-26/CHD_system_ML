const Diagnosis = require("../models/Diagnosis");
const Chat = require("../models/Chat");
const fetch = require("node-fetch");
const https = require("https");

exports.getChatHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const chatDoc = await Chat.findOne({ patientId });

    if (!chatDoc || !Array.isArray(chatDoc.conversation) || chatDoc.conversation.length === 0) {
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
    console.error("❌ Error fetching chat history:", error);
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
    console.error("❌ Error clearing chat history:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
};

const getRecentChatContext = async (patientId, limit = 6) => {
  try {
    const chatDoc = await Chat.findOne({ patientId });

    if (!chatDoc || !Array.isArray(chatDoc.conversation) || chatDoc.conversation.length === 0) {
      return [];
    }

    const recentMessages = chatDoc.conversation.slice(-limit);
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

  } catch (error) {
    console.error("❌ Error fetching recent chat context:", error);
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
          `📊 Model: ${modelUsed}\nConfidence: ${(probability * 100).toFixed(1)}%\n\n` +
          `🩺 Recommendations:\n• Visit a cardiologist\n• Follow a heart-healthy diet\n• Exercise regularly\n• Avoid smoking/alcohol\n• Track blood pressure & cholesterol`;
      } else {
        reply =
          `✅ You are not at risk of CHD according to our latest prediction.\n` +
          `📊 Model: ${modelUsed}\nConfidence: ${(probability * 100).toFixed(1)}%\n\n` +
          `💡 Still, maintain a healthy lifestyle!`;
      }
    }
    else {
      let systemMessage = "You are a helpful health assistant specializing in heart disease. Provide accurate, supportive health information. Keep responses concise and helpful.";

      if (context && context.prediction !== undefined) {
        const riskStatus = parseInt(context.prediction) === 1 ? "at risk" : "not at risk";
        systemMessage += ` The patient is currently ${riskStatus} for coronary heart disease.`;
      }
      let aiReply = "";
      const recentContext = await getRecentChatContext(patientId, 4);

      try {
        const geminiParts = [
          { text: `System: ${systemMessage}` }
        ];
        recentContext.forEach(msg => {
          const roleText = msg.role === 'user' ? 'User' : 'Assistant';
          geminiParts.push({ text: `${roleText}: ${msg.content}` });
        });
        geminiParts.push({ text: `User: ${req.body.message}` });

        const postData = JSON.stringify({
          contents: [{ parts: geminiParts }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 400,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        });

        const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: '/v1beta/models/gemini-2.0-flash:generateContent',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const geminiResponse = await new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
            });

            res.on('end', () => {
              resolve({
                status: res.statusCode,
                data: JSON.parse(data)
              });
            });
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.write(postData);
          req.end();
        });

        if (geminiResponse.status !== 200) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = geminiResponse.data;
        aiReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
                  "⚠️ AI service did not return a response. Please try again.";

      } catch (geminiErr) {
        console.error("❌ Gemini API failed:", geminiErr.message);
        aiReply = "⚠️ AI service is currently unavailable. Please try asking about your heart disease risk or check back later.";
      }

      reply = aiReply;
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
    console.error("❌ Chatbot error:", error.message);
    res.status(500).json({
      reply: "⚠️ Error generating response. Please try again."
    });
  }
};

exports.getConversationStats = async (req, res) => {
  try {
    const { patientId } = req.params;

    const chatDoc = await Chat.findOne({ patientId });

    if (!chatDoc || !Array.isArray(chatDoc.conversation) || chatDoc.conversation.length === 0) {
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
    console.error("❌ Error fetching conversation stats:", error);
    res.status(500).json({ error: "Failed to fetch conversation stats" });
  }
};
