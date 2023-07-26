const mongoose = require('mongoose');
var admin = require("firebase-admin");

const { Constants } = require('../constants');
const {logger} = require('../Config/winston');
const Order = require('../Models/Order');
const OrderNotifications = require('../Notification/OrderNotifications');
const DBOrder = require('../DBLayer/DBOrder');

class OrderService {

    placeOrder(customerId, mealDetails, cookId, foodPrice, deliveryPrice, taxPrice, customerAddress, callback) {
        let order = new Order();
        order.mealDetails = mealDetails.map(i => {
            return {
                mealId: mongoose.Types.ObjectId(i.mealId),
                quantity: i.quantity
            }
        });
        order.customerId = customerId;
        order.cookId = cookId;
        order.foodPrice = foodPrice;
        order.deliveryPrice = deliveryPrice;
        order.taxPrice = taxPrice;
        order.totalPrice = order.foodPrice + order.deliveryPrice + order.taxPrice;
        order.orderTime = Date.now();
        order.customerAddress.state = customerAddress.state;
        order.customerAddress.city = customerAddress.city;
        order.customerAddress.pincode = customerAddress.pincode;
        order.customerAddress.address = customerAddress.address;
        order.customerAddress.streetOrBuildingName = customerAddress.streetOrBuildingName;
        order.customerAddress.landmark = customerAddress.landmark;
        order.customerAddress.latitude = customerAddress.latitude;
        order.customerAddress.longitude = customerAddress.longitude;
        order.customerAddress.mapsAddress = customerAddress.mapsAddress;
        order.save(function(err, result) {
            if(err) {
                logger.error(err);
                callback(Constants.ErrorMessages.InternalServerError, null, 500);
            }

            OrderNotifications.OrderPlaced(result._id);

            callback(null, Constants.SuccessMessages.OrderPlacedSuccessfully, 200);
        });
    }

    async FetchOrdersApprovedByCook (cookId) {
        try {
            let orders = await DBOrder.GetApprovedOrdersByCookId(cookId);
            return this.refactorOrderList(orders);
        }
        catch (err) {
            throw err;
        }
        
    }

    fetchOrderPendingForApproval(cookId, callback) {
        Order.aggregate([
            {
                $match: {
                    cookId: mongoose.Types.ObjectId(cookId),
                    isOrderConfirmedByCook: false,
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
        ]).exec((err, result) => {
            if(err) {
                logger.error(err);
                callback(Constants.ErrorMessages.InternalServerError, null, 500);
            }
            callback(null, this.refactorOrderList(result), 200);
        });
    }

    cookApprovesOrder(orderId, callback) {
        Order.findOneAndUpdate({ _id: orderId }, { isOrderConfirmedByCook: true, orderConfirmedByCookTime: Date.now() }, function (err, order) {
            if(err) {
                logger.error(err);
                callback(Constants.ErrorMessages.InternalServerError, null, 500);
            };

            OrderNotifications.OrderApproved(orderId);

            callback(null, Constants.SuccessMessages.OrderAcceptedByCook, 200);
        })
    }

    cookRejectsOrder(orderId, callback) {
        Order.findOneAndUpdate({ _id: orderId }, { isOrderRejectedByCook: true, orderRejectedByCookTime: Date.now() }, function (err, order) {
            if(err) {
                logger.error(err);
                callback(Constants.ErrorMessages.InternalServerError, null, 500);
            };

            OrderNotifications.OrderRejected(orderId)

            callback(null, Constants.SuccessMessages.OrderRejectedByCook, 200);
        })
    }

    async GetCustomerBookedOrders(customerId) {
        try {
            let orders = await DBOrder.GetBookedOrdersByCustomerId(customerId);
            return this.refactorOrderListForCustomer(orders);
        }
        catch (err) {
            throw err;
        }
    }

    async OrderPrepared(orderId) {
        try {
            let otp = Math.floor(Math.random() * 1000000);
            OrderNotifications.OrderPrepared(orderId);
            OrderNotifications.SendOtp(orderId, otp);
            await DBOrder.UpdateOrderPreparedByOrderId(orderId, otp);
        }
        catch (err) {
            throw err;
        }
    }

    async PreparedOrdersByCook(cookId) {
        try {
            let orders = await DBOrder.GetOrdersPreparedByCook(cookId);
            return this.refactorOrderList(orders);
        }
        catch (err) {
            throw err;
        }
    }

    async isOtpValid(orderId, cookId, otp) {
        try {
            let order = await DBOrder.GetOrderByOrderIdAndCookId(orderId, cookId);
            if(order?.otp === otp) {
                await DBOrder.MarkOrderAsPickedUpByOrderId(orderId);
                return true;
            }
            else return false;
        }
        catch (err) {
            throw err;
        }
    }

    async CookPastOrders(userId) {
        try {
            let pastOrders = await DBOrder.CookPastOrders(userId);
            return this.refactorOrderList(pastOrders);
        }
        catch (err) {
            throw err;
        }
    }

    async GetCustomerPastOrders(customerId) {
        try {
            console.log('here');
            let orders = await DBOrder.CustomerPastOrders(customerId);
            return this.refactorOrderListForCustomer(orders);
        }
        catch (err) {
            throw err;
        }
    }

    refactorOrderList(result) {
        return result.map(i => {
            return {
                mealDetails: this.combineQuantityAndMealDetails(i),
                cookId: i.cookId,
                totalFoodPrice: i.foodPrice,
                deliveryPrice: i.deliveryPrice,
                taxPrice: i.taxPrice,
                totalPrice: i.totalPrice,
                orderTime: i.orderTime,
                customerFirstName: i.customer.firstName,
                customerLastName: i.customer.lastName,
                customerPhoneNumber: i.customer.phoneNumber,
                customerAddress: i.customerAddress,
                cookAddress: i.cook.addresses.filter(j => j.isSelected == true)[0],
                customerId: i.customer._id,
                orderId: i._id,
                isBillPaid: i.isBillPaid == undefined ? false : true,
            }
        });
    }

    refactorOrderListForCustomer(result) {
        return result.map(i => {
            return {
                _id: i._id,
                mealDetails: this.combineQuantityAndMealDetails(i),
                cookId: i.cookId,
                totalFoodPrice: i.foodPrice,
                deliveryPrice: i.deliveryPrice,
                taxPrice: i.taxPrice,
                totalPrice: i.totalPrice,
                orderTime: i.orderTime,
                cookFirstName: i.cook.firstName,
                cookLastName: i.cook.lastName,
                cookAddress: i.cook.addresses.filter(j => j.isSelected == true)[0],
                customerAddress: i.customerAddress,
                cookPhoneNumber: i.cook.phoneNumber,
                customerId: i.customerId,
                orderId: i.orderId,
                isOrderConfirmedByCook: i.isOrderConfirmedByCook,
                orderConfirmedByCookTime: i.orderConfirmedByCookTime,
                isOrderRejectedByCook: i.isOrderRejectedByCook,
                orderRejectedByCookTime: i.orderRejectedByCookTime,
                isOrderPrepared: i.isOrderPrepared,
                orderPreparedTime: i.orderPreparedTime,
                otp: i.otp,
                isBillPaid: i.isBillPaid == undefined ? false : true,
            }
        });
    }

    combineQuantityAndMealDetails (element) {
        let index = 0;
        return element.order.map(j => {
            return {
                dishes: j.dishes,
                images: j.images,
                mealType: j.mealType,
                price: j.price,
                quantity: element.mealDetails[index++].quantity
            }
        });
    }
}

module.exports = new OrderService();