import emailjs from '@emailjs/browser';

// Initialize EmailJS with the public key
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

// Initialize EmailJS
emailjs.init(publicKey);

interface EmailParams {
  [key: string]: string;
  title: string;
  name: string;
  time: string;
  message: string;
  email: string;
}

/**
 * Send an email notification using EmailJS
 */
export const sendEmailNotification = async (params: EmailParams): Promise<boolean> => {
  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      params
    );
    
    if (response.status === 200) {
      console.log('Email sent successfully');
      return true;
    }
    
    console.error('Failed to send email', response);
    return false;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send email notification to chef when a new order is placed
 */
export const sendChefNewOrderNotification = async (
  chefEmail: string, 
  chefName: string,
  orderId: string,
  orderTime: string,
): Promise<boolean> => {
  const orderDetailLink = `${window.location.origin}/chef/order/${orderId}`;
  const shortOrderId = orderId.split('-')[0];
  
  return sendEmailNotification({
    title: 'New Order Notification',
    name: `Order MyGourmet: ${chefName}`,
    time: orderTime,
    message: `You have received a new order (#${shortOrderId}). 
Please check your dashboard to see the details: ${orderDetailLink}`,
    email: chefEmail,
  });
};

/**
 * Send email notification to admin when an order with custom dish is placed
 */
export const sendAdminCustomOrderNotification = async (
  adminEmail: string,
  orderId: string,
  orderTime: string,
): Promise<boolean> => {
  const orderDetailLink = `${window.location.origin}/admin/order/${orderId}`;
  const shortOrderId = orderId.split('-')[0];
  
  return sendEmailNotification({
    title: 'Custom Order Notification',
    name: 'Order MyGourmet',
    time: orderTime,
    message: `A new order with custom dish (#${shortOrderId}) has been placed. 
Please review and set the price: ${orderDetailLink}`,
    email: adminEmail,
  });
};

/**
 * Send email notification to chef when an order is accepted by admin
 */
export const sendChefOrderAcceptedNotification = async (
  chefEmail: string,
  chefName: string,
  orderId: string,
  orderTime: string,
): Promise<boolean> => {
  const orderDetailLink = `${window.location.origin}/chef/order/${orderId}`;
  const shortOrderId = orderId.split('-')[0];
  
  return sendEmailNotification({
    title: 'Order Accepted Notification',
    name: `Order MyGourmet: ${chefName}`,
    time: orderTime,
    message: `New order (#${shortOrderId}) has been accepted by the admin.
Please check your dashboard for details: ${orderDetailLink}`,
    email: chefEmail,
  });
};

/**
 * Send email notification to customer when an order is accepted by admin
 */
export const sendCustomerOrderAcceptedNotification = async (
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderTime: string,
): Promise<boolean> => {
  const orderDetailLink = `${window.location.origin}/orders`;
  const shortOrderId = orderId.split('-')[0];
  
  return sendEmailNotification({
    title: 'Your Order Has Been Accepted',
    name: `Order MyGourmet: ${customerName}`,
    time: orderTime,
    message: `Good news! Your order (#${shortOrderId}) has been accepted. 
Your chef is preparing for your scheduled date. You can view your order details here: ${orderDetailLink}`,
    email: customerEmail,
  });
};

/**
 * Send email notification to customer when an order is rejected by admin
 */
export const sendCustomerOrderRejectedNotification = async (
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderTime: string,
): Promise<boolean> => {
  const orderDetailLink = `${window.location.origin}/orders`;
  const shortOrderId = orderId.split('-')[0];
  
  return sendEmailNotification({
    title: 'Important Update About Your Order',
    name: `Order MyGourmet: ${customerName}`,
    time: orderTime,
    message: `We're sorry to inform you that your order (#${shortOrderId}) cannot be fulfilled at this time. 
Please contact our support team for more information. You can view your order details here: ${orderDetailLink}`,
    email: customerEmail,
  });
}; 