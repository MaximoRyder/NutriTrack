
const fs = require('fs');
const path = require('path');

const files = [
    'src/lib/i18n/en.json',
    'src/lib/i18n/es.json',
    'src/lib/i18n/pt.json'
];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
        console.log(`${file}: OK`);
    } catch (e) {
        console.log(`${file}: ERROR`);
        console.log(e.message);
        // Print context around the error position if available
        if (e.message.match(/at position (\d+)/)) {
            const pos = parseInt(e.message.match(/at position (\d+)/)[1]);
            const content = fs.readFileSync(file, 'utf8');
            const start = Math.max(0, pos - 50);
            const end = Math.min(content.length, pos + 50);
            console.log('Context:');
            console.log(content.substring(start, end));
            console.log('^'.padStart(pos - start + 1));
        }
    }
});
