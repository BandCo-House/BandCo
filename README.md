<div align="center">

<img src="docs/readme/banner.webp" alt="BandCo 로고와 밴드 홈, 공연 스페이스, 일정 투표, AI 물어보기, 라이브러리 화면" width="100%">

<h3>합 맞추기 전에, 일정부터 맞춰요</h3>

날짜 정하기, 세션 짜기, 연습곡 고르기까지<br>
밴드가 함께 정할 일을 **BandCo**에서 한 번에 해요.

</div>

<br>

## 주요 기능

<table>
  <tr>
    <th width="33%">AI 물어보기</th>
    <th width="33%">일정 투표</th>
    <th width="33%">공연 스페이스</th>
  </tr>
  <tr>
    <td align="center"><img src="docs/readme/demo-ai.gif" alt="질문을 입력하면 다음 합주 일정과 참석 인원을 찾아 답하는 화면" width="100%"></td>
    <td align="center"><img src="docs/readme/demo-poll.gif" alt="가능한 시간을 드래그로 골라 일정 투표를 하는 화면" width="100%"></td>
    <td align="center"><img src="docs/readme/demo-space.gif" alt="공연 스페이스에서 일정과 세션 편성을 여는 화면" width="100%"></td>
  </tr>
  <tr>
    <td align="center" valign="top">“다음 합주 몇 명 와?”처럼 물으면<br>밴드 데이터에서 찾아 답해요</td>
    <td align="center" valign="top">되는 시간을 드래그로 고르면<br>시간대별 인원이 바로 쌓여요</td>
    <td align="center" valign="top">공연마다 합주·회의 일정과<br>세션 편성을 한곳에 정리해요</td>
  </tr>
  <tr>
    <th>밴드 홈</th>
    <th>라이브러리</th>
    <th>초대 · 멤버 관리</th>
  </tr>
  <tr>
    <td align="center"><img src="docs/readme/screen-home.webp" alt="공지, 캘린더, 공연 목록이 있는 밴드 홈 화면" width="100%"></td>
    <td align="center"><img src="docs/readme/screen-library.webp" alt="합주곡과 연습 장소가 있는 라이브러리 화면" width="100%"></td>
    <td align="center"><img src="docs/readme/screen-invite.webp" alt="초대 링크 발급과 멤버 추가가 있는 밴드 설정 화면" width="100%"></td>
  </tr>
  <tr>
    <td align="center" valign="top">공지, 이번 주 일정, 준비 중인 공연을<br>한 화면에서 봐요</td>
    <td align="center" valign="top">합주곡과 연습실을 모아 두고<br>곡마다 키·BPM·음원 링크를 저장해요</td>
    <td align="center" valign="top">초대 링크나 이름 검색으로<br>멤버를 추가하고 권한을 관리해요</td>
  </tr>
</table>

## 기술 스택

| 영역 | 기술 |
| :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React_19-1b1b32?style=flat-square&logo=react&logoColor=ecfcab) ![TypeScript](https://img.shields.io/badge/TypeScript-1b1b32?style=flat-square&logo=typescript&logoColor=ecfcab) ![Vite](https://img.shields.io/badge/Vite-1b1b32?style=flat-square&logo=vite&logoColor=ecfcab) ![TanStack](https://img.shields.io/badge/TanStack_Router·Query-1b1b32?style=flat-square&logo=reactquery&logoColor=ecfcab) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-1b1b32?style=flat-square&logo=tailwindcss&logoColor=ecfcab) ![Radix UI](https://img.shields.io/badge/Radix_UI-1b1b32?style=flat-square&logo=radixui&logoColor=ecfcab) ![MSW](https://img.shields.io/badge/MSW-1b1b32?style=flat-square&logo=mockserviceworker&logoColor=ecfcab) ![Vitest](https://img.shields.io/badge/Vitest-1b1b32?style=flat-square&logo=vitest&logoColor=ecfcab) |
| **Backend** | ![NestJS](https://img.shields.io/badge/NestJS_11-1b1b32?style=flat-square&logo=nestjs&logoColor=ecfcab) ![Prisma](https://img.shields.io/badge/Prisma_6-1b1b32?style=flat-square&logo=prisma&logoColor=ecfcab) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-1b1b32?style=flat-square&logo=postgresql&logoColor=ecfcab) ![Swagger](https://img.shields.io/badge/Swagger-1b1b32?style=flat-square&logo=swagger&logoColor=ecfcab) ![Jest](https://img.shields.io/badge/Jest-1b1b32?style=flat-square&logo=jest&logoColor=ecfcab) |
| **AI** | ![Gemini](https://img.shields.io/badge/Gemini-1b1b32?style=flat-square&logo=googlegemini&logoColor=ecfcab) ![pgsql-parser](https://img.shields.io/badge/pgsql--parser_AST_검증-1b1b32?style=flat-square&logo=postgresql&logoColor=ecfcab) |
| **Infra** | ![Docker](https://img.shields.io/badge/Docker-1b1b32?style=flat-square&logo=docker&logoColor=ecfcab) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-1b1b32?style=flat-square&logo=githubactions&logoColor=ecfcab) ![AWS Lightsail](https://img.shields.io/badge/AWS_Lightsail-1b1b32?style=flat-square) ![CloudWatch](https://img.shields.io/badge/CloudWatch-1b1b32?style=flat-square) ![Vercel](https://img.shields.io/badge/Vercel-1b1b32?style=flat-square&logo=vercel&logoColor=ecfcab) |

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
