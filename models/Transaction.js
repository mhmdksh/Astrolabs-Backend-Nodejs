const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' // Assuming 'User' is the model name for your users
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User'
  },
  amount: { 
    type: Number, 
    required: true
  },
  transactionDate: { 
    type: Date, 
    default: Date.now
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending'
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);