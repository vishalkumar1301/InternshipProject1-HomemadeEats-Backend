const mongoose = require('mongoose');

const Order = require('../Models/Order');
const {logger} = require('../Config/winston');
const { Constants } = require('../constants');

class DBOrder {
    async getFCMTokenIdOfCustomerByOrderId(orderId) {
        let result = await Order.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(orderId),
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $unwind: '$customer'
            },
            {
                $project: {
                    fcmToken: '$customer.fcmToken'
                }
            }
        ]).exec();
        return result[0].fcmToken;
    }

    async GetOrderCustomerAndCookByOrderId(orderId) {
        try {
            let order = await Order.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId),
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "cookId",
                        foreignField: "_id",
                        as: "cook"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                {
                    $lookup: {
                        from: "meals",
                        localField: "mealDetails.mealId",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $unwind: "$order"
                },
                {
                    $unwind: "$cook",
                },
                {
                    $unwind: "$customer"
                }
            ]).exec();
            return order[0];
        }
        catch (err) {
            logger.error(err);
        }
    }

    async GetApprovedOrdersByCookId (cookId) {
        try {
            let orders = Order.aggregate([
                {
                    $match: {
                        cookId: mongoose.Types.ObjectId(cookId),
                        isOrderConfirmedByCook: true,
                        isOrderRejectedByCook: false,
                        isOrderPrepared: false
                    }
                },
                {
                    $lookup: {
                        from: "meals",
                        localField: "mealDetails.mealId",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "cookId",
                        foreignField: "_id",
                        as: "cook"
                    }
                },
                {
                    $unwind: "$customer"
                },
                {
                    $unwind: "$cook"
                }
            ]).exec();
            return orders;
        }
        catch (err) {
            throw err;
        }
    }

    async GetBookedOrdersByCustomerId(customerId) {
        try {
            let orders = await Order.aggregate([
                {
                    $match: {
                        customerId: mongoose.Types.ObjectId(customerId),
                        isPickedUp: false
                    }
                },
                {
                    $lookup: {
                        from: "meals",
                        localField: "mealDetails.mealId",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "cookId",
                        foreignField: "_id",
                        as: "cook"
                    }
                },
                {
                    $unwind: '$cook'
                }
            ]).exec();        
            return orders;
        }
        catch (err) {
            throw err;
        }
    }

    async UpdateOrderPreparedByOrderId(orderId, otp) {
        try {
            await Order.findOneAndUpdate({ 
                _id: mongoose.Types.ObjectId(orderId) 
            },
            { 
                isOrderPrepared: true, 
                orderPreparedTime: Date.now(),
                otp: otp
            }).exec();
            return Constants.SuccessMessages.OrderIsPrepared;
        }
        catch (err) {
            throw err;
        }
    }

    async GetOrdersPreparedByCook(cookId) {
        try {    
            let orders = await Order.aggregate([
                {
                    $match: {
                        cookId: mongoose.Types.ObjectId(cookId),
                        isOrderPrepared: true,
                        isOrderConfirmedByCook: true,
                        isOrderRejectedByCook: false,
                        isPickedUp: false,
                    }
                },
                {
                    $lookup: {
                        from: "meals",
                        localField: "mealDetails.mealId",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "cookId",
                        foreignField: "_id",
                        as: "cook"
                    }
                },
                {
                    $unwind: "$customer"
                },
                {
                    $unwind: "$cook"
                }
            ]).exec();
            return orders;
        }
        catch (err) {
            throw err;
        }
    }

    async GetOrderByOrderIdAndCookId(orderId, cookId) {
        try {
            let order = await Order.aggregate([
                {
                    $match: {
                        _id: mongoose.Types.ObjectId(orderId),
                        cookId: mongoose.Types.ObjectId(cookId)
                    }
                }
            ]).exec();
            return order[0];
        }
        catch (err) {
            throw err;
        }
    }

    async MarkOrderAsPickedUpByOrderId(orderId) {
        try {
            let order = await Order.findOneAndUpdate({ 
                _id: mongoose.Types.ObjectId(orderId) 
            },
            { 
                isPickedUp: true, 
                isBillPaid: true,
                pickupTime: Date.now()
            }).exec();
        }
        catch (err) {
            throw err;
        }
    }

    async CookPastOrders(userId) {
        try {
            let orders = await Order.aggregate([
                {
                    $match: {
                        cookId: mongoose.Types.ObjectId(userId),
                        isPickedUp: true
                    }
                },
                {
                    $lookup: {
                        from: "meals",
                        localField: "mealDetails.mealId",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "cookId",
                        foreignField: "_id",
                        as: "cook"
                    }
                },
                {
                    $unwind: "$customer"
                },
                {
                    $unwind: "$cook"
                }
            ]).exec();
            return orders;
        }
        catch (err) {
            throw err;
        }
    }

    async CustomerPastOrders (userId) {
        try {
            let orders = await Order.aggregate([
                {
                    $match: {
                        customerId: mongoose.Types.ObjectId(userId),
                        isPickedUp: true,
                        isBillPaid: true
                    }
                },
                {
                    $lookup: {
                        from: "meals",
                        localField: "mealDetails.mealId",
                        foreignField: "_id",
                        as: "order"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "cookId",
                        foreignField: "_id",
                        as: "cook"
                    }
                },
                {
                    $unwind: "$customer"
                },
                {
                    $unwind: "$cook"
                }
            ]).exec();
            return orders;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = new DBOrder();