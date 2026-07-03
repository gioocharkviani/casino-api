import { setGlobalDispatcher, Agent } from 'undici';

// Test 1: default (might be IPv6)
console.log('--- Without IPv4 force ---');
try {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  console.log('Outbound IP:', data.ip);
} catch (e) {
  console.error('Error:', e.message);
}

// Test 2: with IPv4 forced (same as your services)
console.log('\n--- With IPv4 forced (family: 4) ---');
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));
try {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  console.log('Outbound IP:', data.ip);
} catch (e) {
  console.error('Error:', e.message);
}
