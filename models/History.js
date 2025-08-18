const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: String,
    timestamp: { type: Date, default: Date.now },
    description: String
});


// const historySchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   resumeText: String,
//   jobDescription: String,
//   overallScore: Number,
//   feedback: String,
//   createdAt: { type: Date, default: Date.now }
// });

module.exports = mongoose.model('History', historySchema);