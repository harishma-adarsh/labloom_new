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

module.exports = {
    getTests,
    createTest,
    updateTest,
    deleteTest,
};
