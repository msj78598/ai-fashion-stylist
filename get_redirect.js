import http from 'http';
import https from 'https';

const url = 'https://s.noon.com/8YAjg0aXPdo';

https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Location:', res.headers.location);
}).on('error', (e) => {
    console.error(e);
});
