const { withDatabase } = require('./db.cjs');
const books = [
  ['small-questions', '인문', '작은 질문의 힘', '서도윤', '바쁜 하루 속에서 지나쳤던 질문을 다시 꺼내 보는 가상의 인문 에세이입니다. 나의 선택과 관계를 돌아보는 여섯 장의 이야기로 구성했습니다.', '각자 요즘 마음에 남는 질문 하나를 가져와 이야기하기 좋은 책입니다.'],
  ['walking-together', '인문', '함께 걷는 문장', '한여름', '서로 다른 사람들이 한 문장을 읽고 자신의 경험을 나누는 가상의 이야기입니다. 같은 글에서도 다른 의미를 발견하는 순간을 담았습니다.', '한 문장을 골라 서로 다르게 읽은 이유를 나누어 보세요.'],
  ['slow-days', '에세이', '느린 날의 기록', '문가온', '동네 산책과 작은 일상을 기록한 가상의 에세이입니다. 눈에 띄지 않던 풍경을 발견하고 자신만의 속도를 찾아갑니다.', '가볍게 읽고 시작할 수 있어 첫 모임의 대화 소재로 추천합니다.'],
  ['sunday-bookshop', '에세이', '일요일의 작은 책방', '이새봄', '가상의 작은 책방을 찾는 손님들과 책방지기의 주말을 담았습니다. 서로에게 책 한 권을 권하는 짧은 만남들이 이어집니다.', '우리가 누군가에게 꼭 권하고 싶은 책은 무엇인지 함께 이야기해 보세요.'],
  ['one-step', '성장', '오늘의 한 걸음', '정하루', '작은 습관을 꾸준히 쌓아 가는 방법을 다루는 가상의 성장 안내서입니다. 계획을 세우고 기록하며 돌아보는 간단한 연습을 담았습니다.', '읽은 뒤 각자의 작은 실천 하나를 정하고 다음 모임에서 나누기 좋습니다.'],
  ['learning-notes', '성장', '배움의 여백', '윤다온', '새로운 것을 배우며 만나는 실수와 질문을 다룬 가상의 책입니다. 잘 모르는 것을 인정하고 다시 시도하는 경험을 따라갑니다.', '최근 배운 것과 막혔던 지점을 나누며 서로의 경험에서 힌트를 얻어 보세요.'],
];
withDatabase(async client => {
  for (const name of ['인문', '에세이', '성장']) {
    await client.query('INSERT INTO bookclub_l1.categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
  }
  for (const [seedKey, category, title, author, description, recommendation] of books) {
    await client.query(`INSERT INTO bookclub_l1.books (seed_key, category_id, title, author, description, recommendation)
      SELECT $1, id, $3, $4, $5, $6 FROM bookclub_l1.categories WHERE name = $2
      ON CONFLICT (seed_key) DO UPDATE SET category_id = EXCLUDED.category_id, title = EXCLUDED.title,
      author = EXCLUDED.author, description = EXCLUDED.description, recommendation = EXCLUDED.recommendation`,
    [seedKey, category, title, author, description, recommendation]);
  }
  console.log('가상 분야 3개·도서 6권을 준비했습니다. 사용자가 등록한 책은 보존했습니다.');
});
