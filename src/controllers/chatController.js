const Message = require('../models/Message');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { bookingId, content, type } = req.body;
        const senderId = req.user.id; // Always User ID

        if (!bookingId || !content) {
            return res.status(400).json({ message: 'Booking ID and content are required' });
        }

        // Validate booking and 7-day window
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Identify sender and receiver
        let receiverId;
        let receiverModel;

        // Check if sender is the patient (User)
        if (booking.user.toString() === senderId) {
            // Sender is Patient
            receiverId = booking.doctor;
            // We assume the Booking's doctor ref points to the Doctor's 'User' or 'Doctor' entity.
            // Based on Booking schema, it says 'Doctor'. We will use 'Doctor' to match schema. 
            // If the app relies on User IDs, this might need 'User'. 
            // We'll trust the Booking schema for the Ref.
            receiverModel = 'Doctor';
        }
        // Check if sender is the doctor
        else if (booking.doctor.toString() === senderId) {
            // Sender is Doctor (and their ID matches booking.doctor)
            receiverId = booking.user;
            receiverModel = 'User';
        } else {
            // Fallback: If booking.doctor doesn't match senderId, maybe sender is a User but booking.doctor is a Doctor ID?
            // Since we can't easily resolve this without a comprehensive map, and we assume strict access control:
            return res.status(403).json({ message: 'You are not authorized to chat in this booking' });
        }

        // Check 7-day window from appointment date or completion
        // Use 'date' (Appointment Date)
        const appointmentDate = new Date(booking.date);
        const sevenDaysAfter = new Date(appointmentDate);
        sevenDaysAfter.setDate(appointmentDate.getDate() + 7);
        const now = new Date();

        if (now > sevenDaysAfter) {
            return res.status(403).json({ message: 'Chat window has expired (7 days after appointment)' });
        }

        const message = await Message.create({
            sender: senderId,
            senderModel: 'User', // Logged in user is always a User
            receiver: receiverId,
            receiverModel: receiverModel,
            booking: bookingId,
            content,
            type: type || 'text'
        });

        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get chat history for a booking
// @route   GET /api/chat/:bookingId
// @access  Private
const getChatHistory = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify access
        // We strictly check if the requester is the user or the doctor listed in the booking
        if (booking.user.toString() !== userId && booking.doctor.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        const messages = await Message.find({ booking: bookingId })
            .sort({ createdAt: 1 }) // Oldest first
            .populate('sender', 'name image') // Populate sender details from User (if senderModel is User)
            // Note: If senderModel is 'Doctor', and we populate 'sender', it might fail if we don't setup dynamic ref or if 'Doctor' model doesn't have name/image compatible fields.
            // Message schema uses refPath, so it should populate correctly from the respective model.
            ;

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getChatHistory
};
