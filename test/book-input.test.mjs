import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBookInput, parseBookId } from '../dist/book-input.js';
const valid = { categoryId: 1, title: '  책 제목  ', author: ' 가상 저자 ', recommendation: ' 함께 읽어요. ' };

test('문자 입력 양끝 공백을 제거하고 선택 소개를 빈 문자열로 둔다', () => {
  assert.deepEqual(validateBookInput(valid), { categoryId: 1, title: '책 제목', author: '가상 저자', recommendation: '함께 읽어요.', description: '' });
});
test('공백·잘못된 자료형·길이 초과를 필드별로 거절한다', () => {
  for (const [key, value] of [['title', '   '], ['author', 5], ['title', '가'.repeat(121)], ['recommendation', '가'.repeat(501)], ['description', '가'.repeat(2001)]]) {
    assert.throws(() => validateBookInput({ ...valid, [key]: value }), error => error.getStatus() === 400 && typeof error.getResponse().fieldErrors[key] === 'string');
  }
});
test('분야 번호는 양의 정수만 허용하고 문자열 숫자를 묵시적으로 변환하지 않는다', () => {
  for (const categoryId of ['1', 1.5, 0, -1, null, 2147483648]) {
    assert.throws(() => validateBookInput({ ...valid, categoryId }), error => !!error.getResponse().fieldErrors.categoryId);
  }
});
test('본문 배열·null과 잘못된 상세 경로 번호를 거절한다', () => {
  for (const body of [null, [], 'book']) assert.throws(() => validateBookInput(body));
  for (const id of ['abc', '1 OR 1=1', '1.0', '-1', '0', '2147483648']) assert.throws(() => parseBookId(id));
  assert.equal(parseBookId('12'), 12);
});
