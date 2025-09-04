const FLASK_BASE = "http://localhost:5000";
const NODE_BASE = "http://localhost:4000";
export async function getPrediction(patientData) {
  try {
    if (!patientData.model) {
      throw new Error("Model not selected");
    }
    const response = await fetch(`${FLASK_BASE}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    });
    return await response.json();
  } catch (error) {
    console.error("Prediction error:", error);
    return { error: error.message || "Failed to fetch prediction" };
  }
}
export async function saveDiagnosis(diagnosisData) {
  try {
    const response = await fetch(`${NODE_BASE}/api/diagnosis/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(diagnosisData),
    });
    return await response.json();
  } catch (error) {
    console.error("Save diagnosis error:", error);
    return { error: "Failed to save diagnosis" };
  }
}

export async function getDiagnosisHistory(patientName) {
  try {
    const response = await fetch(`${NODE_BASE}/api/diagnosis/history/${patientName}`);
    const data = await response.json();
    if (Array.isArray(data)) {
      return data;
    } else {
      console.error("Unexpected history data:", data);
      return [];
    }
  } catch (error) {
    console.error("Get history error:", error);
    return [];
  }
}

export async function deleteDiagnosisById(id) {
  try {
    const response = await fetch(`${NODE_BASE}/api/diagnosis/delete/${id}`, {
      method: "DELETE",
    });
    return await response.json();
  } catch (error) {
    console.error("Delete diagnosis error:", error);
    return { error: "Failed to delete diagnosis" };
  }
}

export async function getChatHistory(patientId) {
  try {
    const response = await fetch(`${NODE_BASE}/api/chatbot/history/${patientId}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return [];
  }
}

export async function sendChatMessage(message, patientId) {
  try {
    const response = await fetch(`${NODE_BASE}/api/chatbot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, patientId }),
    });
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Chatbot error:", error);
    return "⚠️ Something went wrong.";
  }
}
export async function getLatestDiagnosis(patientName) {
  try {
    const response = await fetch(`${NODE_BASE}/api/diagnosis/latest/name/${patientName}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch latest diagnosis:", error);
    return null;
  }
}
export const clearChatHistory = async (patientId) => {
  const res = await fetch(`http://localhost:4000/api/chatbot/clear/${patientId}`, {
    method: "DELETE",
  });
  return res.json();
};