const User = require('../models/User');

// @desc    Toggle Doctor Favorite Status
// @route   PUT /api/users/favorites/:doctorId
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const doctorId = req.params.doctorId;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if doctor is already in favorites
        if (user.favorites.includes(doctorId)) {
            // Remove
            user.favorites = user.favorites.filter(id => id.toString() !== doctorId);
        } else {
            // Add
            user.favorites.push(doctorId);
        }

        await user.save();

        // Return updated favorites list
        const updatedUser = await User.findById(req.user.id).populate('favorites');
        res.status(200).json(updatedUser.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get User Favorites
// @route   GET /api/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');
        res.status(200).json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    toggleFavorite,
    getFavorites
};
