// controllers/emergencyContactController.js
const emergencyContactModel = require('../models/emergencyContact');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all emergency contacts
// @route   GET /api/emergency-contacts
// @access  Public
const getAllEmergencyContacts = asyncHandler(async (req, res) => {
    const contacts = await emergencyContactModel.getAllEmergencyContacts();
    res.status(200).json(contacts);
});

// @desc    Get emergency contact by ID
// @route   GET /api/emergency-contacts/:id
// @access  Public
const getEmergencyContactById = asyncHandler(async (req, res) => {
    const contactId = req.params.id;
    const contact = await emergencyContactModel.getEmergencyContactById(contactId);

    // if (!contact) {
    //     return res.status(404).json({ message: 'Emergency contact not found' });
    // }

    if (!contact) {
        return res.status(404).json({ message: req.t('contactNotFound') }); // Use translation function
    }

    res.status(200).json(contact);
});



// // @desc    Get all emergency contacts
// // @route   GET /api/emergency-contacts
// // @access  Public
// const getAllEmergencyContacts = asyncHandler(async (req, res) => {
//     const contacts = await emergencyContactModel.getAllEmergencyContacts();
//     res.status(200).json(contacts);
// });

// // @desc    Get emergency contact by ID
// // @route   GET /api/emergency-contacts/:id
// // @access  Public
// const getEmergencyContactById = asyncHandler(async (req, res) => {
//     const contactId = req.params.id;
//     const contact = await emergencyContactModel.getEmergencyContactById(contactId);

//     if (!contact) {
//         return res.status(404).json({ message: req.t('contactNotFound') });
//     }

//     res.status(200).json(contact);
// });

// @desc    Create a new emergency contact
// @route   POST /api/emergency-contacts
// @access  Protected
const createEmergencyContact = asyncHandler(async (req, res) => {
    const contactData = req.body;
    const newContactId = await emergencyContactModel.createEmergencyContact(contactData);

    res.status(201).json({ message: req.t('contactAdded'), contactId: newContactId });
});

// @desc    Get nearest emergency contacts based on location
// @route   GET /api/emergency-contacts/nearest
// @access  Public
const getNearestEmergencyContacts = asyncHandler(async (req, res) => {
    const { latitude, longitude, category } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    // Validate latitude and longitude
    if (isNaN(userLat) || isNaN(userLng) || userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
        return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }

    // Fetch contacts from the database (adjust query as needed for your DB)
    let contacts = await emergencyContactModel.getAllEmergencyContacts();

    if (category && category !== 'all') {
        contacts = contacts.filter(contact => contact.Category === category);
    }

    // Calculate distance (Haversine formula)
    const R = 6371; // Radius of the earth in km
    const nearestContacts = contacts.map(contact => {
        const contactLat = parseFloat(contact.Latitude);
        const contactLng = parseFloat(contact.Longitude);

        const dLat = deg2rad(contactLat - userLat);
        const dLon = deg2rad(contactLng - userLng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(contactLat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km

        return { ...contact, distance };
    }).sort((a, b) => a.distance - b.distance);

    res.status(200).json(nearestContacts);
});

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// @desc    Create a new emergency contact
// @route   POST /api/emergency-contacts
// @access  Private (Admin)
// const createEmergencyContact = asyncHandler(async (req, res) => {
//     const contactData = req.body;
//     const newContactId = await emergencyContactModel.createEmergencyContact(contactData);

//     // res.status(201).json({ message: 'Emergency contact created', contactId: newContactId });
//     res.status(201).json({ message: req.t('contactAdded'), contactId: newContactId });  // Use translation
// });

// @desc    Update an existing emergency contact
// @route   PUT /api/emergency-contacts/:id
// @access  Private (Admin)
// const updateEmergencyContact = asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const contactData = req.body;  // Contains the fields to update

//     // Check if the contact exists
//     const existingContact = await emergencyContactModel.getEmergencyContactById(id);
//     if (!existingContact) {
//         return res.status(404).json({ message: req.t('contactNotFound') });
//     }

//     await emergencyContactModel.updateEmergencyContact(id, contactData);
//     res.status(200).json({ message: `Emergency contact ${id} updated` });
// });

const updateEmergencyContact = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contactData = req.body;

    console.log("Received ID:", id);
    console.log("Received Data:", contactData);

    const existingContact = await emergencyContactModel.getEmergencyContactById(id);
    if (!existingContact) {
        return res.status(404).json({ message: req.t('contactNotFound') });
    }

    await emergencyContactModel.updateEmergencyContact(id, contactData);
    res.status(200).json({ message: `Emergency contact ${id} updated` });
});


// @desc    Delete an emergency contact
// @route   DELETE /api/emergency-contacts/:id
// @access  Private (Admin)
const deleteEmergencyContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if the contact exists
    const existingContact = await emergencyContactModel.getEmergencyContactById(id);
    if (!existingContact) {
        return res.status(404).json({ message: req.t('contactNotFound') });
    }

    await emergencyContactModel.deleteEmergencyContact(id);
    res.status(200).json({ message: `Emergency contact ${id} deleted` });
});

module.exports = {
    getAllEmergencyContacts,
    getEmergencyContactById,
    createEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    getNearestEmergencyContacts
};

// module.exports = {
//     getAllEmergencyContacts,
//     getEmergencyContactById,
//     createEmergencyContact,
// };