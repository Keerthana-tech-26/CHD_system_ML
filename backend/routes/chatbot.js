const express = require("express");
const router = express.Router();
const { 
  chatbotReply, 
  getChatHistory, 
  clearChatHistory 
} = require("../controllers/chatbotController");

router.post("/respond", chatbotReply);
router.get("/history/:patientId", getChatHistory);

router.delete("/clear/:patientId", clearChatHistory);

module.exports = router;