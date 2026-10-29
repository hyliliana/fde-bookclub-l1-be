# 독서모임 책장 · Level 1 백엔드

추천 도서를 저장하고 조회하는 NestJS API입니다. PostgreSQL의 `bookclub_l1` 스키마에 분야와 책을 각각 저장합니다. SQLite나 임시 메모리 저장소로 바꾸지 않습니다. DB가 연결되지 않으면 서버는 오류 상태를 정직하게 반환합니다.

## 실행 순서

Node.js 22 이상과 pnpm을 사용합니다.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
# .env에 Render PostgreSQL External 주소와 실제 설정값을 넣습니다.
pnpm db:setup
pnpm db:seed
pnpm build
pnpm start
```

기본 서버 주소는 `http://localhost:4000`입니다. 개발 중 소스 변경 후 `pnpm build`를 다시 실행하면 `pnpm start:dev`의 Node 감시 프로세스가 재시작합니다.

- `db:setup`: 이 앱 전용 스키마와 표를 준비합니다. 다시 실행해도 이미 있는 데이터를 삭제하지 않습니다.
- `db:seed`: 가상 분야 3개와 도서 6권을 넣거나 갱신합니다. 사용자가 등록한 책을 삭제하지 않습니다.
- `pnpm test`: 입력 검증, 실제 HTTP 오류 응답, DB 실패 상태, CORS를 검사합니다. 성공적인 DB 등록·조회는 실제 Render DB 연결 후 별도로 확인해야 합니다.

## 설정값

| 이름 | 의미 |
|---|---|
| `DATABASE_URL` | Render PostgreSQL 연결 주소. 로컬은 External, 동일 지역 Render 서비스는 Internal 주소를 사용합니다. |
| `DATABASE_SSL` | External 연결은 `true`로 암호화하고 인증서를 검사합니다. Render의 같은 지역 Internal 연결에 한해서 `false`를 명시할 수 있습니다. 생략하면 `true`입니다. |
| `FRONTEND_URL` | 접속을 허용할 실제 Vercel 화면 주소. 여러 주소는 쉼표로 구분합니다. `http://localhost:3000`도 허용됩니다. |
| `PORT` | 로컬 기본 4000. Render가 제공하는 값이 있으면 그 값을 사용합니다. |

`.env`와 실제 DB 연결 주소를 GitHub에 올리지 마세요. `.env.example`에는 예시 값만 들어 있습니다. SQL은 매개변수 쿼리로 실행하며, 화면에는 DB 주소나 원시 오류를 노출하지 않습니다.

## API

| 방식·주소 | 결과 |
|---|---|
| `GET /categories` | `{id, name}` 배열 |
| `GET /books` | 책 배열, 최근 등록 순서 |
| `GET /books/:id` | 책 한 권. 없는 번호는 404 |
| `POST /books` | 책 등록, 성공 시 201과 등록된 책 |
| `GET /health` | 실제 DB 질의 성공 시 200, 실패 시 503 |

책 응답 필드: `id`, `categoryId`, `categoryName`, `title`, `author`, `description`, `recommendation`, `createdAt`.

등록 본문 예시(분야 번호는 `/categories`에서 확인):

```json
{
  "categoryId": 1,
  "title": "함께 읽는 오후",
  "author": "가상 저자",
  "description": "실습을 위해 만든 가상 도서입니다.",
  "recommendation": "다음 모임에서 서로의 생각을 나누기 좋은 책입니다."
}
```

제목·저자·추천 이유·분야는 필수입니다. 제목과 저자는 120자, 추천 이유는 500자, 소개는 2,000자 이내입니다. 앞뒤 공백을 제거하고, 존재하는 분야의 양의 정수 번호만 받습니다. 오류는 `{message, fieldErrors?}`로 반환합니다.

## Render에 올리기

1. 프론트엔드와 별도의 GitHub 저장소에 이 폴더를 올립니다.
2. 같은 지역의 Render PostgreSQL을 만들거나 지정합니다.
3. 환경 변수를 등록한 뒤 Web Service를 준비합니다.
4. Build Command: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
5. Start Command: `pnpm db:setup && pnpm db:seed && pnpm start`
6. Runtime Node 버전은 `NODE_VERSION=24`를 사용합니다.
7. 배포 주소의 `/health`와 실제 책 등록·조회가 모두 작동하는지 확인합니다.

데이터 준비는 빌드할 때 실행하지 않습니다. 시작 시 실행하는 setup/seed는 이 앱의 데이터만 다루며 멱등적으로 작성했습니다. Render 무료 Web Service는 사용하지 않으면 대기 상태가 되어 첫 접속에 시간이 걸릴 수 있습니다. 무료 PostgreSQL은 워크스페이스당 하나이며 생성 30일 후 만료되므로, 장기 운영용으로 보장되지 않습니다. 현재 계정과 플랜 조건은 [Render 공식 안내](https://render.com/docs/free)를 기준으로 확인하세요.

## 현재 검증 범위

- 자동 검사: 입력 검증·오류 응답·DB 미연결 상태·CORS
- 실제 DB 연결, 초기 데이터, 성공 등록·조회: 연결 설정을 넣은 뒤 확인할 항목
- 공개 배포: 아직 진행하지 않음

기능·화면·데이터 요구사항은 [기획서.md](./기획서.md)를 참고하세요.
