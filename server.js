const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = 4000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};


// Fetch products
app.get('/api/products', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Products');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
});

// Save orders
app.post('/api/orders', async (req, res) => {
    const orderDetails = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const totalAmount = orderDetails.reduce((sum, item) => sum + item.subTotal, 0);

        const result = await pool.request()
            .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
            .input('OrderType', sql.NVarChar, 'Dine-In')
            .query('INSERT INTO Orders (TotalAmount, OrderType) OUTPUT INSERTED.OrderID VALUES (@TotalAmount, @OrderType)');

        const orderID = result.recordset[0].OrderID;

        for (const item of orderDetails) {
            await pool.request()
                .input('OrderID', sql.Int, orderID)
                .input('ProductID', sql.Int, item.productID)
                .input('Quantity', sql.Int, item.quantity)
                .input('SubTotal', sql.Decimal(10, 2), item.subTotal)
                .query('INSERT INTO OrderDetails (OrderID, ProductID, Quantity, SubTotal) VALUES (@OrderID, @ProductID, @Quantity, @SubTotal)');
        }

        res.json({ message: 'Order saved successfully!' });
    } catch (err) {
        console.error('Error saving order:', err);
        res.status(500).json({ error: 'Failed to save the order.' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
