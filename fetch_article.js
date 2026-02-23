const https = require('https');

const post_id = process.argv[2];
const client = process.argv[3] || 'TwilightWars';

if (!post_id) {
    console.error('Usage: node fetch_article.js <post_id> [client]');
    process.exit(1);
}

const options = {
    hostname: 'gamelet.online',
    path: `/discuss_api/get/article/${client}/${post_id}?locale=zh-Hant`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
            console.error('Failed to parse response:', body);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
