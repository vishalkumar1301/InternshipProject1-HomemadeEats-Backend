const NotificationService = require('./NotificationService');
const DBUser = require('../DBLayer/DBUser');
const DBOrder = require('../DBLayer/DBOrder');

class OrderNotifications{
    async OrderPlaced (orderId) {
        let order = await DBOrder.GetOrderCustomerAndCookByOrderId(orderId);
        NotificationService.NotifyToADevice(order.customer.fcmToken, "Your Order has been Placed", "Waiting for confimation from cook");
        NotificationService.NotifyToADevice(order.cook.fcmToken, "New Order", `${order.customer.firstName} ${order.customer.lastName} ordered ${order.order.dishes.length} ${order.order.mealType}`);
    }

    async OrderApproved(orderId) {
        
        let customerFCMToken = await DBOrder.getFCMTokenIdOfCustomerByOrderId(orderId);
        NotificationService.NotifyToADevice(customerFCMToken, "Your order has been approved", "Order is being prepared");
    }

    async OrderRejected(orderId) {

        let customerFCMToken = await DBOrder.getFCMTokenIdOfCustomerByOrderId(orderId);
        NotificationService.NotifyToADevice(customerFCMToken, "Your order has been rejected by cook", "Sorry for the inconvenience");
    }

    async OrderPrepared(orderId) {
        let customerFCMToken = await DBOrder.getFCMTokenIdOfCustomerByOrderId(orderId);
        NotificationService.NotifyToADevice(customerFCMToken, "Your Order is prepared", "check otp in the order details");
    }
    
    async SendOtp(orderId, otp) {
        let customerFCMToken = await DBOrder.getFCMTokenIdOfCustomerByOrderId(orderId);
        NotificationService.NotifyToADevice(customerFCMToken, "Use this otp to pick your order", `${otp}`);
    }
}

module.exports = new OrderNotifications();