const test = require('node:test');
const assert = require('node:assert/strict');
const { isIPv4, validateNetworkProfile, safeArithmeticExpression, calculate } = require('../shared/validation.cjs');
const { sealVault, openVault } = require('../shared/vault.cjs');
const { repeatMatches } = require('../shared/calendar.cjs');

test('IPv4 validation accepts valid addresses and rejects invalid octets', () => {
  assert.equal(isIPv4('10.225.135.113'), true);
  assert.equal(isIPv4('256.1.1.1'), false);
  assert.equal(isIPv4('10.1.1'), false);
});
test('static profiles need explicit gateway, prefix, and valid DNS', () => {
  const profile = { kind:'static', adapter:'Ethernet', ip:'10.225.135.113', gateway:'10.225.135.1', prefix:24, dns:['147.6.44.44','147.6.44.45'] };
  assert.equal(validateNetworkProfile(profile), null);
  assert.match(validateNetworkProfile({...profile,prefix:undefined}), /서브넷/);
  assert.match(validateNetworkProfile({...profile,adapter:"Ethernet'; Remove-Item *"}), /어댑터/);
});
test('DHCP profile does not require static addressing', () => {
  assert.equal(validateNetworkProfile({kind:'dhcp',adapter:'Wi-Fi'}), null);
});
test('calculator handles arithmetic and percent while rejecting code', () => {
  assert.equal(calculate('(1200 + 350) * 1.1'), 1705);
  assert.equal(calculate('200 * 10%'), 20);
  assert.throws(() => calculate('process.exit()'));
  assert.throws(() => calculate('1/0'));
});
test('vault encrypts its contents and rejects the wrong master password', async () => {
  const secret = JSON.stringify([{account:'example',password:'private-value'}]);
  const sealed = await sealVault(secret, 'correct-horse-battery');
  assert.equal(JSON.stringify(sealed).includes('private-value'), false);
  assert.equal(await openVault(sealed, 'correct-horse-battery'), secret);
  await assert.rejects(() => openVault(sealed, 'wrong-password'));
});

test('calendar repeat rules match daily, weekday, and day-of-month schedules', () => {
  assert.equal(repeatMatches('2026-10-14', '2026-10-15', 'daily'), true);
  assert.equal(repeatMatches('2026-10-14', '2026-10-21', 'weekly'), true);
  assert.equal(repeatMatches('2026-10-14', '2026-11-14', 'monthly'), true);
  assert.equal(repeatMatches('2026-10-14', '2026-11-15', 'monthly'), false);
  assert.equal(repeatMatches('2026-10-14', '2026-10-13', 'daily'), false);
});
