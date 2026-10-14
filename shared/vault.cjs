const crypto = require('node:crypto');
const deriveKey = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 32, (error, key) => error ? reject(error) : resolve(key));
});
async function sealVault(plain, password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  if (salt.length !== 16) throw new Error('Invalid vault salt.');
  const key = await deriveKey(password, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return { salt:salt.toString('hex'), iv:iv.toString('hex'), tag:cipher.getAuthTag().toString('hex'), data:encrypted.toString('hex') };
}
async function openVault(item, password) {
  try {
    const salt = Buffer.from(item.salt, 'hex');
    const key = await deriveKey(password, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(item.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(item.tag, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(item.data, 'hex')), decipher.final()]).toString('utf8');
  } catch { throw new Error('비밀번호가 올바르지 않거나 저장 데이터가 손상되었습니다.'); }
}
module.exports = { sealVault, openVault };
