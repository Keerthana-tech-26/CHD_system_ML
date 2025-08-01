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
      required: true,
    },
    reply: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
