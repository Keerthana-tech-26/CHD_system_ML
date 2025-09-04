const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: false,
      default: "general",
    },
    message: {
      type: String,
      required: false,
    },
    reply: {
      type: String,
      required: false,
    },
    conversation: {
      type: [{
        role: {
          type: String,
          enum: ['user', 'assistant'],
          required: true
        },
        content: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }],
      default: []
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);
chatSchema.index({ patientId: 1, lastActive: -1 });

module.exports = mongoose.model("Chat", chatSchema);