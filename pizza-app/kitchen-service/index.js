const express = require('express');
const cors = require('cors');
const pino = require('pino');

const logger = pino({ name: 'kitchen-service' });

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

const SLOW_KITCHEN = process.env.SLOW_KITCHEN === 'true';

// Simulate async delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check oven temperature (simulated)
async function checkOvenTemperature() {
  await sleep(10);
  return { temperature: 450, status: 'optimal' };
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'kitchen-service' });
});

// Check kitchen availability
app.post('/check-availability', async (req, res) => {
  const { orderId, pizzaType } = req.body;
  
  logger.info({ orderId, pizzaType }, 'Checking availability');
  
  await sleep(50);
  
  // Kitchen is always available (for now)
  res.json({
    available: true,
    orderId,
    message: 'Kitchen is ready to cook!'
  });
});

// Cook pizza
app.post('/cook', async (req, res) => {
  const { orderId, pizzaType, size } = req.body;
  
  logger.info({ orderId, pizzaType, size }, 'Starting to cook');
  
  if (pizzaType === 'Hawaiian') {
    return res.status(403).json({
      error: 'pineapple on pizza is forbidden',
      orderId
    });
  }
  
  // Check oven temperature
  const ovenStatus = await checkOvenTemperature();
  logger.info({ orderId, ovenTemperature: ovenStatus.temperature }, 'Oven temperature');
  
  // Simulate cooking time
  let cookingTime = 15; // minutes
  
  if (size === 'Large') {
    cookingTime = 20;
  } else if (size === 'Small') {
    cookingTime = 10;
  }
  
  // Simulate slow kitchen (broken oven scenario)
  if (SLOW_KITCHEN) {
    logger.warn({ orderId }, 'Slow mode: oven is having issues');
    await sleep(5000); // 5 second delay
    cookingTime = 30; // Takes longer
  } else {
    await sleep(300); // Normal cooking simulation
  }
  
  logger.info({ orderId, cookingTime }, 'Order cooked successfully');
  
  res.json({
    orderId,
    status: 'cooked',
    pizzaType,
    size,
    cookingTime,
    ovenTemperature: ovenStatus.temperature
  });
});

app.listen(PORT, () => {
  logger.info({ port: PORT, slowKitchen: SLOW_KITCHEN }, 'Kitchen Service listening');
});
