const Diagnosis = require("../models/Diagnosis");
const Chat = require("../models/Chat");
exports.getChatHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const chatHistory = await Chat.find({ patientId })
      .sort({ createdAt: 1 })
      .select('message reply createdAt updatedAt');
    res.status(200).json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};
exports.clearChatHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    await Chat.deleteMany({ patientId });
    res.status(200).json({ 
      success: true,
      message: 'Chat history cleared successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat history' });
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
        const latestDiagnosis = await Diagnosis.findOne({ patientId }).sort({ timestamp: -1 });
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
    } else if (userMessage.includes("hello") || userMessage.includes("hi")) {
      reply = "👋 Hello! I'm your AI Health Assistant. Ask me about your heart disease risk by typing 'Am I at risk?'";
    } else if (userMessage.includes("help")) {
      reply = "🤖 I can help you understand your heart disease risk. Try asking:\n• 'Am I at risk?'\n• 'What should I do?'\n• 'Tell me about my prediction'";
    } else {
      reply = "🤖 I'm focused on heart disease. Try asking: 'Am I at risk?' or 'What should I do?'";
    }

    await Chat.create({
      patientId,
      message: req.body.message,
      reply,
    });

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ reply: "⚠️ Error generating response." });
  }
};