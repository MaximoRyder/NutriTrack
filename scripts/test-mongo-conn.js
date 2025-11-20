const fs = require('fs');
const mongoose = require('mongoose');

(async () => {
    try {
        const c = fs.readFileSync('.env.local', 'utf8');
        const m = c.match(/MONGODB_URI=(.+)/);
        if (!m) {
            console.error('MONGODB_URI not found in .env.local');
            process.exit(2);
        }
        const uri = m[1].trim();
        console.log('Using URI (masked):', uri.replace(/:(.*)@/, ':********@'));
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('CONNECTED');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('CONNECT ERROR:');
        console.error(err);
        process.exit(1);
    }
})();
