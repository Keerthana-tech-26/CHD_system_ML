const mongoose = require('mongoose');
require('dotenv').config();
const OldChatSchema = new mongoose.Schema({
  patientId: String,
  message: String,
  reply: String,
}, { timestamps: true });

const OldChat = mongoose.model('OldChat', OldChatSchema, 'chats'); // Use existing collection
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

const NewChatSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
  },
  conversation: [messageSchema],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const NewChat = mongoose.model('NewChat', NewChatSchema, 'chats_new'); // Temporary new collection

async function migrateChats() {
  try {
    console.log('🔄 Starting chat migration...');
    
    const oldChats = await OldChat.find({}).sort({ createdAt: 1 });
    console.log(`📊 Found ${oldChats.length} old chat messages`);
    
    if (oldChats.length === 0) {
      console.log('ℹ️  No chat messages found to migrate. Exiting...');
      return;
    }
    const patientConversations = {};
    
    oldChats.forEach(chat => {
      if (!patientConversations[chat.patientId]) {
        patientConversations[chat.patientId] = [];
      }
      
      patientConversations[chat.patientId].push({
        role: 'user',
        content: chat.message,
        timestamp: chat.createdAt || new Date()
      });
      
      patientConversations[chat.patientId].push({
        role: 'assistant',
        content: chat.reply,
        timestamp: chat.updatedAt || chat.createdAt || new Date()
      });
    });
    
    console.log(`👥 Found conversations for ${Object.keys(patientConversations).length} patients`);
    const newDocs = [];
    for (const [patientId, conversation] of Object.entries(patientConversations)) {
      newDocs.push({
        patientId,
        conversation,
        lastActive: conversation[conversation.length - 1].timestamp
      });
    }
    await NewChat.deleteMany({});
    await NewChat.insertMany(newDocs);
    console.log('✅ Migration completed successfully!');
    console.log('\n📈 Migration Summary:');
    console.log(`• Migrated ${oldChats.length} individual messages`);
    console.log(`• Created ${newDocs.length} conversation documents`);
    console.log(`• Average messages per patient: ${(oldChats.length / newDocs.length / 2).toFixed(1)}`);
    console.log('\n🔍 Sample migrated conversation:');
    const samplePatient = Object.keys(patientConversations)[0];
    console.log(`Patient: ${samplePatient}`);
    console.log(`Messages: ${patientConversations[samplePatient].length}`);
    console.log(`First message: "${patientConversations[samplePatient][0].content.substring(0, 50)}..."`);
    
    console.log('\n⚠️  Next steps:');
    console.log('1. ✅ Migration completed - your data is now in "chats_new" collection');
    console.log('2. 🔄 Update your Chat.js model with the new schema');
    console.log('3. 🔄 Update your chatbotController.js with the new controller');
    console.log('4. 🧪 Test your application with the new structure');
    console.log('5. 🗑️  Once confirmed working, you can drop the old "chats" collection');
    console.log('6. 🏷️  Rename "chats_new" to "chats" in MongoDB');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.DB_CONNECTION || 'mongodb://localhost:27017/your-database-name';
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    await migrateChats();
    
    console.log('\n🏁 Migration process completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}
main();