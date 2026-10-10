<div align="center">

<img src="docs/readme/banner.webp" alt="BandCo. 합 맞추기 전에, 일정부터 맞춰요. 날짜 정하기, 세션 짜기, 연습곡 고르기까지 밴드가 함께 정할 일을 한곳에서 해요." width="100%">

<br>
<br>

<img src="docs/readme/demo-ai.gif" alt="AI 물어보기: 질문을 입력하면 밴드 데이터에서 다음 합주 일정과 참석 인원을 찾아 답하는 화면" width="31%">
&nbsp;
<img src="docs/readme/demo-poll.gif" alt="일정 투표: 가능한 시간을 드래그로 골라 투표하면 시간대별 인원이 늘어나는 화면" width="31%">
&nbsp;
<img src="docs/readme/demo-space.gif" alt="공연 스페이스: 밴드 홈에서 공연 스페이스로 들어가 일정과 세션 편성을 여는 화면" width="31%">

<br>
<br>

<img src="docs/readme/feature-01.webp" alt="01 밴드 홈. 우리 밴드 소식, 홈에서 한 번에. 공지, 이번 주 일정, 준비 중인 공연이 한 화면에 모여 있어요. 가입한 밴드는 카드로 모아 보고, 공지와 캘린더, 공연 목록을 한눈에 봐요." width="100%">

<img src="docs/readme/feature-02.webp" alt="02 공연 스페이스. 공연 하나에 필요한 합주를 전부. 공연마다 스페이스를 만들고 합주와 회의를 타임라인으로 정리해요. 합주·회의 필터와 내 일정만 보기, 곡·키·장소가 담긴 일정 상세, 파트별 멤버와 장비까지 담은 세션 편성." width="100%">

<img src="docs/readme/feature-03.webp" alt="03 일정 투표. 되는 시간만 쓱 긁어 주세요. 가능한 시간을 드래그로 고르면 시간대마다 인원이 바로 쌓여요. 후보 날짜와 시간대로 투표를 만들고, 가능한 인원 표와 명단을 확인해요." width="100%">

<img src="docs/readme/feature-04.webp" alt="04 AI 물어보기. 궁금한 건 그냥 물어보세요. '다음 합주 몇 명 와?'처럼 물으면 밴드 데이터에서 찾아 답해요. 숫자는 크게, 순위는 목록으로 보여 주고, 어떤 조건으로 찾았는지 함께 표시해요. 자주 묻는 질문은 눌러서 바로 물어봐요." width="100%">

<img src="docs/readme/feature-05.webp" alt="05 라이브러리와 프로필. 연습곡도, 연습실도, 내 파트도. 합주곡과 자주 가는 연습실을 모아 두고 내 플레이 파트를 프로필로 보여 줘요. 곡마다 키·BPM·음원 링크를 저장하고, 대표 영상이 담긴 프로필 카드를 만들어요." width="100%">

<img src="docs/readme/feature-06.webp" alt="06 초대와 멤버 관리. 링크 하나면 멤버가 모여요. 초대 링크를 보내거나 이름으로 찾아 바로 추가해요. 멤버 권한과 팀을 관리하고, 이메일과 Google로 로그인해요." width="100%">

<img src="docs/readme/tech.webp" alt="기술과 구조. Frontend: React 19, React Compiler, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS v4, Radix UI, MSW, Vitest. Backend: NestJS 11, Prisma 6, PostgreSQL, Swagger, Jest. AI: Gemini, pgsql-parser AST 검증. Infra: Docker, GitHub Actions, AWS Lightsail, Secrets Manager, CloudWatch, Vercel. Frontend(React, Vercel)가 REST로 Backend(NestJS, Lightsail)를 호출하고, Backend는 PostgreSQL, Object Storage, Gemini를 사용해요. GitHub Actions가 Docker 이미지를 빌드해 Lightsail에 배포해요." width="100%">

</div>

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
