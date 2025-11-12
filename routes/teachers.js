const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get('/:teacherId/stats', async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!isValidObjectId(teacherId)) {
      return res.status(400).json({ message: 'Invalid teacher ID' });
    }

    const teacher = await User.findById(teacherId).select(
      'role name email profileImage bio subjects experience teacherRating'
    );

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const matchFilter = {
      teacher: new mongoose.Types.ObjectId(teacherId),
      isActive: true
    };

    const [activeCourses, totalStudentsAgg] = await Promise.all([
      Course.countDocuments(matchFilter),
      Course.aggregate([
        { $match: matchFilter },
        { $unwind: '$enrolledStudents' },
        {
          $group: {
            _id: '$enrolledStudents.student'
          }
        },
        {
          $count: 'total'
        }
      ])
    ]);

    const totalStudents = totalStudentsAgg.length > 0 ? totalStudentsAgg[0].total : 0;

    const averageRating = teacher.teacherRating ? teacher.teacherRating.average : 0;
    const reviewCount = teacher.teacherRating ? teacher.teacherRating.count : 0;

    res.json({
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        profileImage: teacher.profileImage,
        bio: teacher.bio,
        subjects: teacher.subjects,
        experience: teacher.experience
      },
      stats: {
        totalStudents,
        activeCourses,
        averageRating,
        reviewCount
      }
    });
  } catch (error) {
    console.error('Get teacher stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:teacherId/reviews', async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!isValidObjectId(teacherId)) {
      return res.status(400).json({ message: 'Invalid teacher ID' });
    }

    const teacher = await User.findById(teacherId)
      .select('teacherReviews teacherRating role')
      .populate('teacherReviews.student', 'name profileImage')
      .populate('teacherReviews.course', 'title');

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({
      rating: teacher.teacherRating || { average: 0, count: 0 },
      reviews: teacher.teacherReviews
    });
  } catch (error) {
    console.error('Get teacher reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:teacherId/reviews', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { studentId, courseId, rating, comment } = req.body;

    if (!isValidObjectId(teacherId)) {
      return res.status(400).json({ message: 'Invalid teacher ID' });
    }

    if (!isValidObjectId(studentId) || !isValidObjectId(courseId)) {
      return res.status(400).json({ message: 'Invalid student or course ID' });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const [teacher, student, course] = await Promise.all([
      User.findById(teacherId),
      User.findById(studentId),
      Course.findById(courseId)
    ]);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit reviews' });
    }

    if (!course || course.teacher.toString() !== teacherId) {
      return res.status(404).json({ message: 'Course not found for this teacher' });
    }

    const isEnrolled = course.enrolledStudents.some(
      (enrollment) => enrollment.student.toString() === studentId
    );

    if (!isEnrolled) {
      return res.status(403).json({ message: 'Student must be enrolled in the course to review' });
    }

    await teacher.addTeacherReview(studentId, courseId, rating, comment || '');

    const updatedTeacher = await User.findById(teacherId)
      .select('teacherReviews teacherRating')
      .populate('teacherReviews.student', 'name profileImage')
      .populate('teacherReviews.course', 'title');

    const ratingSummary = updatedTeacher.teacherRating || { average: 0, count: 0 };
    const reviews = updatedTeacher.teacherReviews || [];

    res.status(201).json({
      message: 'Review submitted successfully',
      rating: ratingSummary,
      reviews
    });
  } catch (error) {
    console.error('Submit teacher review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


