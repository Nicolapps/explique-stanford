const debug = require('debug')('express-passport:ca');
const fs = require('fs');
const path = require('path');
const pem = require('pem');
const promisify = require('util').promisify;

const createCertificate = promisify(pem.createCertificate);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const resolve = path.resolve.bind(path, __dirname, 'ca');
const writeFile = promisify(fs.writeFile);

module.exports = async () => {
  try {
    debug('searching for saved certificate...');
    const [ expire, key, cert ] = await Promise.all([
      readFile(resolve('ca.dat')),
      readFile(resolve('ca.key')),
      readFile(resolve('ca.crt')),
    ]);
    if (expire > Number(new Date)) {
      debug('saved certificate found and valid');
      return { ca: { key, cert }, saved: true };
    } else {
      throw 'expired';
    }
  } catch (err) {
    debug(`error: ${err && err.message || err}`);
    debug('making new certificate');
    const keys = await createCertificate({ days: 365, selfSigned: true });
    try {
      debug(`saving certificate to ${resolve()}`);
      await mkdir(resolve(), { recursive: true });
      await Promise.all([
        writeFile(resolve('ca.dat'), String(Number(new Date) + 31536e3)),
        writeFile(resolve('ca.key'), keys.serviceKey),
        writeFile(resolve('ca.crt'), keys.certificate),
      ]);
    } catch (err) {
      console.log({...err, message: err.message  })
      debug(`error: ${err && err.message || err}`);
    }
    const ca = { key: keys.serviceKey, cert: keys.certificate };
    return { ca, saved: false };
  }
};
