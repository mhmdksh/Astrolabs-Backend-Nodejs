const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountBalance: { type: Number, default: 0 }, // Added account balance with a default of 0
  accountNumber: { type: String, required: true, unique: true }, // Added account number, ensure uniqueness
  // Optional: Consider how you'll store transaction history. This could be an array of transaction IDs, for example.
  transactionHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Method to check password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);