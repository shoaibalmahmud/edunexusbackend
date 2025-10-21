const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash'],
    required: false,
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  refundReason: {
    type: String,
    default: ''
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
orderSchema.index({ student: 1, course: 1 });
orderSchema.index({ teacher: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Method to complete order
orderSchema.methods.completeOrder = function(transactionId) {
  this.status = 'completed';
  this.paymentStatus = 'paid';
  this.transactionId = transactionId;
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason) {
  this.status = 'cancelled';
  this.notes = reason;
  return this.save();
};

// Method to refund order
orderSchema.methods.refundOrder = function(reason) {
  this.status = 'refunded';
  this.paymentStatus = 'refunded';
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
