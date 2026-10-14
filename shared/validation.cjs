const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
function isIPv4(value) { return typeof value === 'string' && IPV4.test(value); }
function validateNetworkProfile(profile) {
  if (!profile || !/^[\w가-힣 .()_-]{1,80}$/.test(profile.adapter || '')) return '네트워크 어댑터 이름을 확인해 주세요.';
  const dns = profile.dns || [];
  if (profile.kind === 'dhcp') return dns.some(x => !isIPv4(x)) ? 'DNS 주소를 확인해 주세요.' : null;
  if (!isIPv4(profile.ip) || !isIPv4(profile.gateway) || !Number.isInteger(profile.prefix) || profile.prefix < 1 || profile.prefix > 32 || dns.length < 1 || dns.some(x => !isIPv4(x))) return 'IP, 게이트웨이, 서브넷 프리픽스(1~32), DNS 주소를 확인해 주세요.';
  return null;
}
function safeArithmeticExpression(expression) {
  return typeof expression === 'string' && expression.length > 0 && expression.length < 180 && /^[\d.+\-*/()%\s]+$/.test(expression);
}
function calculate(expression) {
  if (!safeArithmeticExpression(expression)) throw new Error('계산식을 확인해 주세요.');
  const value = Function(`"use strict";return (${expression.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)')})`)();
  if (!Number.isFinite(value)) throw new Error('계산 결과가 유효하지 않습니다.');
  return Number(value.toFixed(10));
}
module.exports = { isIPv4, validateNetworkProfile, safeArithmeticExpression, calculate };
