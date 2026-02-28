import https from 'https';

const url = 'https://onelink.shein.com/31/5huksr9tehbe';

https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Location:', res.headers.location);
}).on('error', (e) => {
    console.error(e);
});
