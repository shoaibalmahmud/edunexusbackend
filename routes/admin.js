const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Order = require('../models/Order');

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      totalTeachers,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status (Admin only)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all courses (Admin only)
router.get('/courses', async (req, res) => {
  try {
    const { isPublished, isActive, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const courses = await Course.find(filter)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    res.json({
      courses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course status (Admin only)
router.patch('/courses/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.isActive = isActive;
    await course.save();

    res.json({
      message: 'Course status updated successfully',
      course
    });
  } catch (error) {
    console.error('Update course status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders (Admin only)
router.get('/orders', async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    let groupBy = {};
    if (period === 'monthly') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else if (period === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    }

    const revenueData = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: 30 }
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get top performing teachers
router.get('/analytics/top-teachers', async (req, res) => {
  try {
    const topTeachers = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$teacher',
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      { $unwind: '$teacher' },
      {
        $project: {
          teacher: {
            name: 1,
            email: 1,
            profileImage: 1
          },
          totalRevenue: 1,
          totalOrders: 1
        }
      }
    ]);

    res.json(topTeachers);
  } catch (error) {
    console.error('Get top teachers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get popular courses
router.get('/analytics/popular-courses', async (req, res) => {
  try {
    const popularCourses = await Course.aggregate([
      { $match: { isPublished: true, isActive: true } },
      {
        $project: {
          title: 1,
          teacher: 1,
          price: 1,
          enrolledCount: { $size: '$enrolledStudents' },
          rating: 1
        }
      },
      { $sort: { enrolledCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'teacher',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      { $unwind: '$teacher' },
      {
        $project: {
          title: 1,
          price: 1,
          enrolledCount: 1,
          rating: 1,
          teacher: {
            name: 1,
            email: 1
          }
        }
      }
    ]);

    res.json(popularCourses);
  } catch (error) {
    console.error('Get popular courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Delete user (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user && req.user.id === id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Check if user is a teacher with published courses
    if (user.role === 'teacher') {
      const teacherCourses = await Course.find({ teacher: id, isPublished: true });
      if (teacherCourses.length > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete teacher with published courses. Please unpublish or transfer courses first.' 
        });
      }
    }

    // Check if user has active orders
    const userOrders = await Order.find({ 
      $or: [
        { student: id },
        { teacher: id }
      ],
      status: { $in: ['pending', 'completed'] }
    });

    if (userOrders.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active orders. Please contact support.' 
      });
    }

    // Delete user's unpublished courses if they're a teacher
    if (user.role === 'teacher') {
      await Course.deleteMany({ teacher: id, isPublished: false });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
