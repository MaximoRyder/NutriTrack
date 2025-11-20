const fs = require('fs');
const mongoose = require('mongoose');

function parseUri(uri) {
    // mongodb+srv://user:pass@host/db?opts
    const m = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:@\/\s]+):([^@\/\s]+)@(.+)$/);
    if (!m) return null;
    return {
        proto: m[1],
        user: m[2],
        pass: m[3],
        rest: m[4],
    };
}

(async () => {
    try {
        const c = fs.readFileSync('.env.local', 'utf8');
        const mm = c.match(/MONGODB_URI=(.+)/);
        if (!mm) {
            console.error('MONGODB_URI not found in .env.local');
            process.exit(2);
        }
        const uriRaw = mm[1].trim();
        console.log('URI from .env.local (masked):', uriRaw.replace(/:(.*)@/, ':********@'));

        const tryConnect = async (uri, label) => {
            console.log('\nTrying connection:', label, uri.replace(/:(.*)@/, ':********@'));
            try {
                await mongoose.connect(uri, { // options minimal for modern driver
                    serverSelectionTimeoutMS: 10000,
                });
                console.log('CONNECTED with', label);
                await mongoose.disconnect();
                return true;
            } catch (err) {
                console.error('CONNECT ERROR for', label, err && err.message ? err.message : err);
                return false;
            }
        };

        // First try raw
        let ok = await tryConnect(uriRaw, 'raw');
        if (ok) return process.exit(0);

        // parse and try encoded password
        const parsed = parseUri(uriRaw);
        if (!parsed) {
            console.log('Could not parse URI, not attempting encoded try. Provide a standard mongodb+srv://user:pass@... URI');
            return process.exit(1);
        }

        const { proto, user, pass, rest } = parsed;
        const encodedPass = encodeURIComponent(decodeURIComponent(pass));
        if (encodedPass === pass) {
            console.log('Password appears already encoded or has no special chars. No alternate try will be attempted.');
            return process.exit(1);
        }

        const uriEncoded = proto + user + ':' + encodedPass + '@' + rest;
        ok = await tryConnect(uriEncoded, 'encoded-pass');
        if (ok) return process.exit(0);

        console.log('\nTried raw and URL-encoded password variants; authentication still failed.');
        console.log('Siguientes pasos sugeridos:');
        console.log('- Revisa que el usuario exista en Atlas y que la contraseña sea la correcta.');
        console.log('- Asegúrate de que tu IP está en Network Access (0.0.0.0/0 para pruebas).');
        console.log('- Si cambias la contraseña en Atlas, actualiza .env.local y reinicia el servidor.');

        process.exit(1);
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
})();
