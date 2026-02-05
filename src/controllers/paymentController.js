const PaymentMethod = require('../models/PaymentMethod');

// @desc    Get user payment methods
// @route   GET /api/payments/methods
// @access  Private
const getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentMethod.find({ user: req.user.id });
        res.status(200).json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new payment method
// @route   POST /api/payments/methods
// @access  Private
const addPaymentMethod = async (req, res) => {
    try {
        const { brand, last4, expMonth, expYear, isDefault } = req.body;

        if (isDefault) {
            // Unset other defaults
            await PaymentMethod.updateMany({ user: req.user.id }, { isDefault: false });
        }

        const method = await PaymentMethod.create({
            user: req.user.id,
            brand,
            last4,
            expMonth,
            expYear,
            isDefault
        });

        res.status(201).json(method);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete payment method
// @route   DELETE /api/payments/methods/:id
// @access  Private
const deletePaymentMethod = async (req, res) => {
    try {
        const method = await PaymentMethod.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!method) {
            return res.status(404).json({ message: 'Payment method not found' });
        }
        res.status(200).json({ message: 'Payment method removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod
};
