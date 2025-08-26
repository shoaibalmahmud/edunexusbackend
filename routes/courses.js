const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Order = require('../models/Order');

// Create new course (Teacher only)
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      subject, 
      level, 
      price, 
      duration, 
      requirements, 
      learningOutcomes,
      maxStudents,
      tags,
      teacherId 
    } = req.body;

    // Verify teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'Invalid teacher ID' });
    }

    const course = new Course({
      title,
      description,
      teacher: teacherId,
      subject,
      level,
      price,
      duration,
      requirements: requirements || [],
      learningOutcomes: learningOutcomes || [],
      maxStudents: maxStudents || 50,
      tags: tags || []
    });

    await course.save();

    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all published courses
router.get('/', async (req, res) => {
  try {
    const { 
      subject, 
      level, 
      minPrice, 
      maxPrice, 
      teacherId,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const filter = { 
      isPublished: true, 
      isActive: true 
    };

    if (subject) filter.subject = subject;
    if (level) filter.level = level;
    if (teacherId) filter.teacher = teacherId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    let query = Course.find(filter)
      .populate('teacher', 'name email profileImage bio subjects experience')
      .sort({ createdAt: -1 });

    if (search) {
      query = Course.find({ 
        ...filter, 
        $text: { $search: search } 
      }).populate('teacher', 'name email profileImage bio subjects experience');
    }

    const skip = (page - 1) * limit;
    const courses = await query.skip(skip).limit(parseInt(limit));
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

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email profileImage bio subjects experience education')
      .populate('enrolledStudents.student', 'name email profileImage')
      .populate('reviews.student', 'name profileImage');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course (Teacher only)
router.put('/:id', async (req, res) => {
  try {
    const { teacherId } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const updateFields = [
      'title', 'description', 'subject', 'level', 'price', 'duration',
      'requirements', 'learningOutcomes', 'maxStudents', 'tags', 'materials', 'syllabus'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    res.json({
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish/Unpublish course (Teacher only)
router.patch('/:id/publish', async (req, res) => {
  try {
    const { teacherId, isPublished } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    course.isPublished = isPublished;
    await course.save();

    res.json({
      message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
      course
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (Teacher only)
router.delete('/:id', async (req, res) => {
  try {
    const { teacherId } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // Check if any students are enrolled
    if (course.enrolledStudents.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course with enrolled students. Please contact support.' 
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll in course (Student only)
router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId, paymentMethod } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
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
      course: course._id,
      teacher: course.teacher,
      amount: course.price,
      paymentMethod
    });

    await order.save();

    // Enroll student in course
    await course.enrollStudent(studentId);

    res.json({
      message: 'Enrolled successfully',
      order,
      course
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add review to course (Student only)
router.post('/:id/review', async (req, res) => {
  try {
    const { studentId, rating, comment } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student is enrolled
    const isEnrolled = course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === studentId
    );
    
    if (!isEnrolled) {
      return res.status(400).json({ message: 'Must be enrolled to review this course' });
    }

    await course.addReview(studentId, rating, comment);

    res.json({
      message: 'Review added successfully',
      course
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course progress (Student only)
router.patch('/:id/progress', async (req, res) => {
  try {
    const { studentId, progress } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await course.updateProgress(studentId, progress);

    res.json({
      message: 'Progress updated successfully',
      course
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher's courses
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const courses = await Course.find({ 
      teacher: req.params.teacherId 
    }).populate('teacher', 'name email profileImage');

    res.json(courses);
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's enrolled courses
router.get('/student/:studentId', async (req, res) => {
  try {
    const courses = await Course.find({
      'enrolledStudents.student': req.params.studentId
    }).populate('teacher', 'name email profileImage');

    res.json(courses);
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add course materials (Teacher only)
router.post('/:id/materials', async (req, res) => {
  try {
    const { teacherId, materials } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized to add materials to this course' });
    }

    // Validate materials array
    if (!Array.isArray(materials)) {
      return res.status(400).json({ message: 'Materials must be an array' });
    }

    // Validate each material
    for (const material of materials) {
      if (!material.title || !material.type || !material.url) {
        return res.status(400).json({ 
          message: 'Each material must have title, type, and url' 
        });
      }

      if (!['video', 'document', 'link', 'quiz'].includes(material.type)) {
        return res.status(400).json({ 
          message: 'Material type must be one of: video, document, link, quiz' 
        });
      }
    }

    // Add materials to course
    course.materials.push(...materials);
    await course.save();

    res.json({
      message: 'Materials added successfully',
      course
    });
  } catch (error) {
    console.error('Add materials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course materials (Student only)
router.get('/:id/materials', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course.materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update specific material (Teacher only)
router.put('/:id/materials/:materialIndex', async (req, res) => {
  try {
    const { teacherId, title, type, url, description, duration } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized to update materials for this course' });
    }

    const materialIndex = parseInt(req.params.materialIndex);
    if (materialIndex < 0 || materialIndex >= course.materials.length) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Update material fields
    if (title !== undefined) course.materials[materialIndex].title = title;
    if (type !== undefined) {
      if (!['video', 'document', 'link', 'quiz'].includes(type)) {
        return res.status(400).json({ 
          message: 'Material type must be one of: video, document, link, quiz' 
        });
      }
      course.materials[materialIndex].type = type;
    }
    if (url !== undefined) course.materials[materialIndex].url = url;
    if (description !== undefined) course.materials[materialIndex].description = description;
    if (duration !== undefined) course.materials[materialIndex].duration = duration;

    await course.save();

    res.json({
      message: 'Material updated successfully',
      course
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete specific material (Teacher only)
router.delete('/:id/materials/:materialIndex', async (req, res) => {
  try {
    const { teacherId } = req.body;
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Not authorized to delete materials from this course' });
    }

    const materialIndex = parseInt(req.params.materialIndex);
    if (materialIndex < 0 || materialIndex >= course.materials.length) {
      return res.status(404).json({ message: 'Material not found' });
    }

    // Remove material from array
    course.materials.splice(materialIndex, 1);
    await course.save();

    res.json({
      message: 'Material deleted successfully',
      course
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
