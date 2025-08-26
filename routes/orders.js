const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Course = require('../models/Course');
const User = require('../models/User');

// Get all orders (Admin only)
router.get('/', async (req, res) => {
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

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('student', 'name email profileImage')
      .populate('teacher', 'name email profileImage')
      .populate('course', 'title description price thumbnail');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's orders
router.get('/student/:studentId', async (req, res) => {
  try {
    const orders = await Order.find({ student: req.params.studentId })
      .populate('teacher', 'name email profileImage')
      .populate('course', 'title description price thumbnail')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get student orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher's orders
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const orders = await Order.find({ teacher: req.params.teacherId })
      .populate('student', 'name email profileImage')
      .populate('course', 'title description price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get teacher orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId, paymentMethod } = req.body;

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Verify course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not available for purchase' });
    }

    // Check if student is already enrolled
    const isEnrolled = course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === studentId
    );
    
    if (isEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check if course is full
    if (course.enrolledStudents.length >= course.maxStudents) {
      return res.status(400).json({ message: 'Course is full' });
    }

    // Create order
    const order = new Order({
      student: studentId,
      course: courseId,
      teacher: course.teacher,
      amount: course.price,
      paymentMethod
    });

    await order.save();

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete order (mark as paid)
router.patch('/:id/complete', async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Order is already completed' });
    }

    await order.completeOrder(transactionId);

    // Enroll student in course
    const course = await Course.findById(order.course);
    if (course) {
      await course.enrollStudent(order.student);
    }

    res.json({
      message: 'Order completed successfully',
      order
    });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed order' });
    }

    await order.cancelOrder(reason);

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Refund order
router.patch('/:id/refund', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Can only refund completed orders' });
    }

    await order.refundOrder(reason);

    // Remove student from course enrollment
    const course = await Course.findById(order.course);
    if (course) {
      course.enrolledStudents = course.enrolledStudents.filter(
        enrollment => enrollment.student.toString() !== order.student.toString()
      );
      await course.save();
    }

    res.json({
      message: 'Order refunded successfully',
      order
    });
  } catch (error) {
    console.error('Refund order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    const refundedOrders = await Order.countDocuments({ status: 'refunded' });

    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
