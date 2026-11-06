import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRange } from '../dist/attachments/range.js';

test('parseRange: no or unsupported range serves the whole file', () => {
  assert.equal(parseRange(undefined, 10), undefined);
  assert.equal(parseRange('', 10), undefined);
  assert.equal(parseRange('bytes=0-1,4-5', 10), undefined);
  assert.equal(parseRange('items=0-1', 10), undefined);
  assert.equal(parseRange('bytes=-', 10), undefined);
  assert.equal(parseRange('bytes=5-2', 10), undefined);
  assert.equal(parseRange('bytes=a-2', 10), undefined);
});

test('parseRange: satisfiable ranges', () => {
  assert.deepEqual(parseRange('bytes=2-5', 10), { start: 2, end: 5 });
  assert.deepEqual(parseRange('bytes=0-0', 10), { start: 0, end: 0 });
  assert.deepEqual(parseRange('bytes=2-100', 10), { start: 2, end: 9 });
  assert.deepEqual(parseRange('bytes=7-', 10), { start: 7, end: 9 });
  assert.deepEqual(parseRange('bytes=-4', 10), { start: 6, end: 9 });
  assert.deepEqual(parseRange('bytes=-100', 10), { start: 0, end: 9 });
});

test('parseRange: unsatisfiable ranges', () => {
  assert.equal(parseRange('bytes=10-', 10), 'unsatisfiable');
  assert.equal(parseRange('bytes=10-12', 10), 'unsatisfiable');
  assert.equal(parseRange('bytes=-0', 10), 'unsatisfiable');
});
