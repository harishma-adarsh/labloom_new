const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Labloom API',
            version: '1.0.0',
            description: 'API documentation for Labloom Healthcare Application',
        },
        servers: [
            {
                url: process.env.SWAGGER_SERVER_URL || 'https://labloom-new.onrender.com',
                description: 'Production server',
            },
            {
                url: 'http://localhost:5000',
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Use absolute path for Vercel/Serverless compatibility
    apis: [path.join(__dirname, '../routes/*.js')],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
