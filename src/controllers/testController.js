const Test = require('../models/Test');

// @desc    Get all tests
// @route   GET /api/tests
// @access  Public
const getTests = async (req, res) => {
    try {
        const tests = await Test.find();
        res.status(200).json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a test
// @route   POST /api/tests
// @access  Private
const createTest = async (req, res) => {
    try {
        const test = await Test.create(req.body);
        res.status(201).json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a test
// @route   PUT /api/tests/:id
// @access  Private
const updateTest = async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.status(200).json(test);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a test
// @route   DELETE /api/tests/:id
// @access  Private
const deleteTest = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        await test.remove();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get test by ID
// @route   GET /api/tests/:id
// @access  Public
const getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.status(200).json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Seed sample tests
// @route   POST /api/tests/seed
// @access  Public
const seedTests = async (req, res) => {
    try {
        const sampleTests = [
            { name: "Blood Glucose", price: 25.00, duration: "1 day", category: "diabetes", description: "Standard blood sugar measurement." },
            { name: "Full Blood Count", price: 45.00, duration: "2 days", category: "general", description: "Analysis of red and white blood cells." },
            { name: "Hormonal Panel", price: 120.00, duration: "3 days", category: "hormonal", description: "Check balance of various hormones." },
            { name: "Lipid Profile", price: 60.00, duration: "1 day", category: "cardiac", description: "Cholesterol and triglyceride levels." }
        ];

        await Test.deleteMany();
        const createdTests = await Test.insertMany(sampleTests);
        res.status(200).json({ message: 'Tests seeded successfully', count: createdTests.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTests,
    createTest,
    updateTest,
    deleteTest,
    getTestById,
    seedTests
};

