# 독서모임 책장 · Level 1 백엔드

상태: 공개배포 · **공개 주소 핵심 사용 경로 검증 완료 / 제출 전**

- API: [https://fde-bookclub-l1-be.onrender.com](https://fde-bookclub-l1-be.onrender.com) · [DB 연결 확인](https://fde-bookclub-l1-be.onrender.com/health)
- 프론트엔드: [https://fde-bookclub-l1-fe.vercel.app](https://fde-bookclub-l1-fe.vercel.app)
- 공개 소스: [hyliliana/fde-bookclub-l1-be](https://github.com/hyliliana/fde-bookclub-l1-be)
- 프론트엔드 소스: [hyliliana/fde-bookclub-l1-fe](https://github.com/hyliliana/fde-bookclub-l1-fe)

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
- `pnpm test`: 입력 검증, 실제 HTTP 오류 응답, DB 실패 상태, CORS를 검사합니다. 실제 Render DB의 등록·조회도 로컬 통합 검사에서 확인했습니다.

## 설정값

| 이름 | 의미 |
|---|---|
| `DATABASE_URL` | 실제 배포는 Render PostgreSQL External 연결 주소를 사용합니다. 비밀 값은 백엔드 환경 설정에만 저장합니다. |
| `DATABASE_SSL` | 실제 배포 값은 `true`이며 TLS 인증서 검증이 켜져 있습니다. 생략해도 `true`입니다. |
| `FRONTEND_URL` | 실제 값은 `https://fde-bookclub-l1-fe.vercel.app`입니다. 여러 주소는 쉼표로 구분하며 `http://localhost:3000`도 허용됩니다. |
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

## Render 배포

이 백엔드는 위 공개 GitHub 저장소를 Render **Public Git repository** 방식으로 지정해 배포했습니다. 자동 연동 배포가 아니므로 소스를 push한 뒤 Render에서 수동 배포해야 서버 코드가 갱신됩니다.

현재 두 앱은 Singapore 지역의 Render PostgreSQL Free 1개를 공유합니다. 이 앱은 `bookclub_l1` 스키마만 사용합니다. 실제 연결은 External URL과 `DATABASE_SSL=true`로 설정했으며 TLS 인증서를 검증합니다.

재배포 명령 기준:

- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Start: `pnpm db:setup && pnpm db:seed && pnpm start`
- Node: `NODE_VERSION=24.19.0`
- 허용 프론트엔드: `FRONTEND_URL=https://fde-bookclub-l1-fe.vercel.app`

DB 준비는 빌드 중에 실행하지 않습니다. 시작 시 실행하는 setup/seed는 이 앱의 스키마만 다루며 사용자 자료를 지우지 않습니다. 프론트엔드는 해당 GitHub 소스 ZIP을 Vercel **Drop to Deploy**로 올렸으며, 프론트엔드 배포용 `.env.production`에는 공개 `NEXT_PUBLIC_API_URL`만 포함했습니다.

무료 Render Web Service는 대기 상태에서 첫 접속이 느릴 수 있습니다. 현재 무료 DB의 만료 예정일은 **2026년 11월 28일**입니다. 장기 운영 전에 [Render 공식 플랜 안내](https://render.com/docs/free)를 확인하세요.

## 현재 검증 상태

- 백엔드 기본 검사 **9개 통과**: 입력 검증·HTTP 오류·DB 실패 상태·CORS.
- 실제 Render DB 연결·초기 데이터·성공 등록과 조회를 로컬 통합 검사에서 확인했습니다.
- 로컬 화면의 목록·상세·등록·잘못된 입력과 모바일 화면을 확인했습니다.
- 공개 배포와 별도 공개 GitHub 저장소 생성·push를 완료했습니다.
- 공식 Playwright MCP로 로그인하지 않은 PC·모바일 환경에서 공개 목록과 상세 화면을 확인했습니다.
- 공개 화면에서 입력 오류 안내와 신규 가상 도서 등록(201) → 상세 표시 → 새 브라우저 세션 재접속 후 데이터 보존을 확인했습니다.
- 현재 상태는 **공개 주소 핵심 사용 경로 검증 완료 / 제출 전**이며 최종 제출은 제출자가 직접 진행합니다.

기능·화면·데이터 요구사항은 [기획서.md](./기획서.md)를 참고하세요.
