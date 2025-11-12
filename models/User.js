const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student'
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  // Teacher specific fields
  subjects: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number,
    default: 0
  },
  education: {
    type: String,
    default: ''
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  teacherRating: {
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
  teacherReviews: {
    type: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: {
        type: String,
        default: ''
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },
  // Student specific fields
  grade: {
    type: String,
    default: ''
  },
  interests: [{
    type: String,
    trim: true
  }],
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Method to add or update teacher review
userSchema.methods.addTeacherReview = function(studentId, courseId, rating, comment) {
  if (!this.teacherReviews) {
    this.teacherReviews = [];
  }

  this.teacherReviews = this.teacherReviews.filter(
    review => review.student.toString() !== studentId.toString()
  );

  this.teacherReviews.push({
    student: studentId,
    course: courseId,
    rating,
    comment
  });

  const totalRating = this.teacherReviews.reduce((sum, review) => sum + review.rating, 0);
  this.teacherRating.average = this.teacherReviews.length > 0
    ? totalRating / this.teacherReviews.length
    : 0;
  this.teacherRating.count = this.teacherReviews.length;

  return this.save();
};

module.exports = mongoose.model('User', userSchema);
