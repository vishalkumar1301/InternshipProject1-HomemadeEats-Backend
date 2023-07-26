const mongoose = require('mongoose');

let DeliveryPersonSchema = new mongoose.Schema({
    deliveryPersonId: {
        required: true,
        ref: 'User', 
        type: mongoose.Schema.Types.ObjectId,
    },
    latitude: {
        
    }
})