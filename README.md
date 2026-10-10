<div align="center">

<img src="docs/readme/banner.webp" alt="BandCo 로고와 밴드 홈, 공연 스페이스, 일정 투표, AI 물어보기, 라이브러리 화면" width="100%">

<h3>합 맞추기 전에, 일정부터 맞춰요</h3>

날짜 정하기, 세션 짜기, 연습곡 고르기까지<br>
밴드가 함께 정할 일을 **BandCo**에서 한 번에 해요.

</div>

<br>

<div align="center">
  <h3>공연 스페이스</h3>
  <p>공연마다 합주와 회의를 타임라인으로 정리하고<br>곡과 키, 파트별 멤버와 장비까지 담아요.</p>
  <img src="docs/readme/demo-space.gif" alt="밴드 홈에서 공연 스페이스로 들어가 일정을 여는 화면" width="36%">
  <img src="docs/readme/screen-schedule.webp" alt="연습할 곡과 세션 편성이 담긴 일정 상세 화면" width="36%">
</div>

<br>

<div align="center">
  <h3>일정 투표</h3>
  <p>되는 시간을 드래그로 고르면<br>시간대마다 가능한 인원이 바로 쌓여요.</p>
  <img src="docs/readme/demo-poll.gif" alt="가능한 시간을 드래그로 골라 투표하는 화면" width="36%">
  <img src="docs/readme/screen-poll.webp" alt="시간대별 가능한 인원이 표시된 투표 결과 화면" width="36%">
</div>

<br>

<div align="center">
  <h3>밴드 홈 · 라이브러리 · 초대</h3>
  <p>공지와 일정은 홈에서, 합주곡은 라이브러리에서<br>새 멤버는 초대 링크 하나로 모아요.</p>
  <img src="docs/readme/screen-home.webp" alt="공지, 캘린더, 공연 목록이 있는 밴드 홈 화면" width="28%">
  <img src="docs/readme/screen-library.webp" alt="합주곡과 연습 장소가 있는 라이브러리 화면" width="28%">
  <img src="docs/readme/screen-invite.webp" alt="초대 링크 발급과 멤버 추가가 있는 밴드 설정 화면" width="28%">
</div>

<br>

<div align="center">
  <h3>AI 물어보기</h3>
  <p>“다음 합주 몇 명 와?”처럼 물으면<br>밴드 데이터에서 찾아 바로 답해요.</p>
  <img src="docs/readme/demo-ai.gif" alt="질문을 입력하면 다음 합주 일정과 참석 인원을 찾아 답하는 화면" width="36%">
  <img src="docs/readme/screen-ai.webp" alt="이번 달 많이 연습한 곡을 순위로 보여 주는 답변 화면" width="36%">
</div>

<br>

## 기술 스택

- **Frontend** React 19, TypeScript, Vite, TanStack Router · Query, Tailwind CSS v4, Radix UI, MSW, Vitest
- **Backend** NestJS 11, Prisma 6, PostgreSQL, Swagger, Jest
- **Infra** Docker, GitHub Actions, AWS Lightsail, CloudWatch, Vercel

## 아키텍처

```mermaid
flowchart LR
  web["Frontend<br>React · Vercel"] -->|REST API| api["Backend<br>NestJS · Lightsail"]
  api --> db[("PostgreSQL")]
  api -->|Presigned URL| storage[("Object Storage")]
  api -->|질문 → 검증된 SELECT| llm["Gemini"]
  gha["GitHub Actions"] -->|Docker 이미지 배포| api
  api -.->|로그| cw["CloudWatch"]
```

<details>
<summary><b>프로젝트 구조</b></summary>

<br>

```text
.
├── frontend/            # React 앱
│   └── src/
│       ├── app/         # 앱 진입점, 프로바이더, 레이아웃
│       ├── pages/       # TanStack Router 파일 기반 라우트
│       ├── widgets/     # 여러 기능을 조합한 화면 단위 블록
│       ├── features/    # 사용자 행동 단위 기능
│       ├── entities/    # 도메인 모델과 API
│       ├── shared/      # 공통 UI, 유틸, API 클라이언트
│       └── mocks/       # MSW 목 핸들러
├── backend/             # NestJS API
│   ├── src/modules/     # bands, schedules, schedule-polls, songs, teams ...
│   ├── prisma/          # 스키마와 마이그레이션
│   └── docs/            # API 명세, 설계 문서, Git 규칙
├── infra/               # Discord 알림
├── scripts/             # PR 생성 스크립트
└── docs/readme/         # README 이미지
```

</details>
