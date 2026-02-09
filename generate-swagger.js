const fs = require('fs');
const path = require('path');
const specs = require('./src/config/swagger');

const outputPath = path.join(__dirname, 'src/swagger-output.json');

console.log('Generating swagger.json at: ' + outputPath);
fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));

console.log('Swagger JSON generated successfully');
