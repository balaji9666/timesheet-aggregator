const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '../certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

// Generate private key
execSync('openssl genrsa -out certs/private.key 2048');

// Generate CSR
execSync('openssl req -new -key certs/private.key -out certs/certificate.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"');

// Generate self-signed certificate
execSync('openssl x509 -req -days 365 -in certs/certificate.csr -signkey certs/private.key -out certs/certificate.crt');

console.log('SSL certificates generated successfully in the certs directory'); 