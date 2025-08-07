const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
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
});
const chatSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    conversation: [messageSchema],
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);
chatSchema.pre('save', function() {
  this.lastActive = new Date();
});

module.exports = mongoose.model("Chat", chatSchema);