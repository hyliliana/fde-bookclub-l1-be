const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { once } = require('node:events');
let server;
let base;

before(async () => {
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['dist/main.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test', DATABASE_SSL: 'false', FRONTEND_URL: 'https://bookclub.example.test' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i++) {
    try { await fetch(`${base}/health`); return; } catch { await new Promise(resolve => setTimeout(resolve, 50)); }
  }
  throw new Error('테스트 서버를 시작하지 못했습니다.');
});
after(async () => {
  if (server && server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill('SIGTERM');
    await exited;
  }
});
test('실제 DB 연결 실패는 /health 503이고 정상으로 꾸미지 않는다', async () => {
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: 'error', database: 'disconnected' });
});
test('DB 연결 실패 응답에는 주소나 원시 오류가 노출되지 않는다', async () => {
  const response = await fetch(`${base}/books`);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.match(body.message, /잠시 후/);
  assert.doesNotMatch(JSON.stringify(body), /postgres|127\.0\.0\.1|ECONNREFUSED/);
});
test('화면을 우회한 잘못된 POST를 DB 연결 전에 검사한다', async () => {
  const response = await fetch(`${base}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: '1', title: ' ', author: '', recommendation: '' }) });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.deepEqual(Object.keys(body.fieldErrors).sort(), ['author', 'categoryId', 'recommendation', 'title']);
});
test('잘못된 상세 번호와 존재하지 않는 경로를 한국어로 안내한다', async () => {
  const invalid = await fetch(`${base}/books/not-a-number`);
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).message, /책 번호/);
  const unknown = await fetch(`${base}/missing`);
  assert.equal(unknown.status, 404);
  assert.match((await unknown.json()).message, /찾을 수 없습니다/);
});
test('CORS는 허용된 화면 출처만 반영한다', async () => {
  const allowed = await fetch(`${base}/health`, { headers: { Origin: 'https://bookclub.example.test' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://bookclub.example.test');
  const forbidden = await fetch(`${base}/health`, { headers: { Origin: 'https://other.example.test' } });
  assert.equal(forbidden.headers.get('access-control-allow-origin'), null);
});
