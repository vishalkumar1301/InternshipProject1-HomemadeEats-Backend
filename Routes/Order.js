const express = require('express');

const orderRoute = express.Router();
const OrderService = require('../Service/OrderService');
const { JSONResponse } = require('../Constants/Response');
const { Constants } = require('../constants');
const {logger} = require('../Config/winston');

// customer places an order
orderRoute.post('/', function (req, res) {
    OrderService.placeOrder(req.user._id , req.body.mealDetails, req.body.cookId, req.body.foodPrice, req.body.deliveryPrice, req.body.taxPrice, req.body.customerAddress, function (error, success, statusCode) {
        if(error) {
            res.status(statusCode).json(new JSONResponse(error).getJson());
        }
        res.status(statusCode).send(new JSONResponse(null, success).getJson());
    });
});

// fetch the orders approved by cook
orderRoute.get('/cook/booked', async function (req, res) {
    try {
        let orders = await OrderService.FetchOrdersApprovedByCook(req.user._id);
        res.status(200).send(orders);
    }
    catch (err) {
        logger.error('\nError in route /order/customer', err);
        res.status(500).json(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
})

// gets the orders, pending for approval by cook.
orderRoute.get('/cook/pending', function(req, res) {
    OrderService.fetchOrderPendingForApproval(req.user._id, function(error, success, statusCode) {
        if(error) {
            res.status(statusCode).json(new JSONResponse(error).getJson());
        }
        res.status(statusCode).send(success);
    });
});

// cook approves an order based on availability
orderRoute.post('/cook/approve', function (req, res) {
    OrderService.cookApprovesOrder(req.body.orderId, function(error, success, statusCode) {
        if(error) {
            res.status(statusCode).json(new JSONResponse(error).getJson());
        }
        res.status(statusCode).send(new JSONResponse(null, success).getJson());
    });
});

// cook rejects an order based on availability
orderRoute.post('/cook/reject', function (req, res) {
    OrderService.cookRejectsOrder(req.body.orderId, function(error, success, statusCode) {
        if(error) {
            res.status(statusCode).json(new JSONResponse(error).getJson());
        }
        res.status(statusCode).send(new JSONResponse(null, success).getJson());
    });
});

// get all the orders booked by customer
orderRoute.get('/customer/booked', async function (req, res) {
    try {
        let orders = await OrderService.GetCustomerBookedOrders(req.user._id);
        res.status(200).send(orders);
    }
    catch (err) {
        logger.error('\nError in route /order/customer', err);
        res.status(500).json(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
});

// cook has prepared order
orderRoute.post('/cook/prepared', async function (req, res) {
    try {
        await OrderService.OrderPrepared(req.body.orderId);
        res.status(200).json(new JSONResponse(null, Constants.SuccessMessages.OrderIsPrepared).getJson());
    }
    catch (err) {
        logger.error(err);
        res.status(500).json(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
})

// get orders already prepared for pickup by cook
orderRoute.get('/cook/prepared', async function(req, res) {
    try {
        let preparedOrders = await OrderService.PreparedOrdersByCook(req.user._id);
        res.status(200).send(preparedOrders);
    }
    catch (err) {
        logger.error(err);
        res.status(500).json(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
});

orderRoute.post('/cook/verifyotp', async function(req, res) {
    try {
        let isOtpValid = await OrderService.isOtpValid(req.body.orderId, req.user._id, req.body.otp);
        if(isOtpValid) {
            res.status(200).json(new JSONResponse(null, Constants.SuccessMessages.OtpIsValid).getJson());
        }
        else {
            res.status(422).json(new JSONResponse(Constants.ErrorMessages.InvalidOTP).getJson());
        }
    }
    catch (err) {
        logger.error(err);
        res.status(500).status(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
});

orderRoute.get('/pastOrders', async function (req, res) {
    try {
        if(req.user.userType == Constants.UserType.Cook){
            let pastOrders = await OrderService.CookPastOrders(req.user._id)
            res.status(200).json(pastOrders)
        }
        else {
            let pastOrders = await OrderService.GetCustomerPastOrders(req.user._id)
            res.status(200).json(pastOrders)
        }
    }
    catch (err) {
        logger.error(err);
        res.status(500).status(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
})

module.exports = orderRoute;