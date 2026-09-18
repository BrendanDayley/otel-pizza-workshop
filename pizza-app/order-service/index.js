const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const KITCHEN_SERVICE_URL = process.env.KITCHEN_SERVICE_URL || 'http://localhost:3001';
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://localhost:3002';

// Generate order ID
function generateOrderId() {
  return `PIZZA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'order-service' });
});

// Create pizza order
app.post('/order', async (req, res) => {
  const { pizzaType, size, customerName } = req.body;
  const orderId = generateOrderId();
  
  console.log(`Order received: ${orderId} - ${size} ${pizzaType} for ${customerName}`);
  
  try {
    // Step 1: Check kitchen availability
    console.log(`Checking kitchen availability for order ${orderId}`);
    const kitchenResponse = await axios.post(`${KITCHEN_SERVICE_URL}/check-availability`, {
      orderId,
      pizzaType,
      size
    });
    
    if (!kitchenResponse.data.available) {
      console.log(`Kitchen not available for order ${orderId}`);
      return res.status(503).json({ 
        error: 'Kitchen is currently unavailable',
        orderId 
      });
    }
    
    // Step 2: Start cooking
    console.log(`Starting to cook order ${orderId}`);
    const cookResponse = await axios.post(`${KITCHEN_SERVICE_URL}/cook`, {
      orderId,
      pizzaType,
      size
    });
    
    // Step 3: Assign delivery driver
    console.log(`Assigning driver for order ${orderId}`);
    const deliveryResponse = await axios.post(`${DELIVERY_SERVICE_URL}/assign-driver`, {
      orderId,
      customerName,
      size
    });
    
    console.log(`Order ${orderId} completed successfully`);
    
    res.json({
      orderId,
      status: 'confirmed',
      pizzaType,
      size,
      customerName,
      estimatedTime: cookResponse.data.cookingTime + deliveryResponse.data.estimatedDeliveryTime,
      driver: deliveryResponse.data.driverName,
      message: `Your ${size} ${pizzaType} pizza will be delivered in ${cookResponse.data.cookingTime + deliveryResponse.data.estimatedDeliveryTime} minutes!`
    });
    
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to process order',
      orderId,
      details: error.message 
    });
  }
});

// Get order status
app.get('/order/:orderId', (req, res) => {
  const { orderId } = req.params;
  console.log(`Status check for order ${orderId}`);
  
  res.json({
    orderId,
    status: 'in-progress',
    message: 'Your pizza is being prepared'
  });
});

app.listen(PORT, () => {
  console.log(`Order Service listening on port ${PORT}`);
  console.log(`Kitchen Service URL: ${KITCHEN_SERVICE_URL}`);
  console.log(`Delivery Service URL: ${DELIVERY_SERVICE_URL}`);
});
