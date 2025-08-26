const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in hours
    required: true,
    min: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  materials: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['video', 'document', 'link', 'quiz'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    duration: {
      type: Number, // in minutes
      default: 0
    }
  }],
  syllabus: [{
    week: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    materials: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    }]
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  maxStudents: {
    type: Number,
    default: 50
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better search performance
courseSchema.index({ title: 'text', description: 'text', subject: 'text' });

// Virtual for enrolled students count
courseSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.length;
});

// Method to add student to course
courseSchema.methods.enrollStudent = function(studentId) {
  const existingEnrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (!existingEnrollment) {
    this.enrolledStudents.push({
      student: studentId,
      enrolledAt: new Date(),
      progress: 0,
      completed: false
    });
  }
  
  return this.save();
};

// Method to update student progress
courseSchema.methods.updateProgress = function(studentId, progress) {
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (enrollment) {
    enrollment.progress = Math.min(100, Math.max(0, progress));
    if (enrollment.progress === 100) {
      enrollment.completed = true;
    }
  }
  
  return this.save();
};

// Method to add review
courseSchema.methods.addReview = function(studentId, rating, comment) {
  // Remove existing review by this student
  this.reviews = this.reviews.filter(
    review => review.student.toString() !== studentId.toString()
  );
  
  // Add new review
  this.reviews.push({
    student: studentId,
    rating,
    comment
  });
  
  // Update average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);
