# Notifications 모듈

경로: `jamplay/backend/src/modules/notifications/`

---

## 파일 목록

```
notifications/
├── notifications.module.ts
├── notifications.controller.ts
├── notifications.service.ts
├── notifications.service.spec.ts
├── dto/
│   ├── get-notifications-query.dto.ts
│   ├── mark-many-read.dto.ts
│   └── delete-many-notifications.dto.ts
├── repositories/
│   ├── notifications.repository.ts
│   ├── notifications.prisma-repository.ts
│   └── notifications.prisma-repository.spec.ts
└── types/
    ├── notification-list-item.type.ts
    ├── mark-notification-read-result.type.ts
    ├── mark-many-read-result.type.ts
    ├── mark-all-read-result.type.ts
    ├── delete-notification-result.type.ts
    └── delete-many-notifications-result.type.ts
```

---

## DB 모델

```prisma
model Notification {
  id          String           @id @default(uuid())
  userId      String           @map("user_id")
  type        NotificationType
  title       String           @db.VarChar(120)
  description String?
  targetPath  String?          @map("target_path")
  isRead      Boolean          @default(false) @map("is_read")
  remindsAt   DateTime?        @map("reminds_at")
  createdAt   DateTime?        @default(now())

  @@index([userId, isRead])
  @@index([userId, isRead, type])
}

enum NotificationType { INVITE  NOTICE  REMINDER }
```

---

## 비즈니스 규칙 메모

- 알림은 본인 것만 조회/수정/삭제 가능 (JWT userId로 필터링)
- `markRead`, `markManyRead`, `markAllRead`: `isRead = true` 업데이트
- `deleteMany`: 특정 알림 ID 목록 삭제
- 다른 userId의 알림을 조작하려 하면 `ForbiddenException` 또는 무시 처리
- 커서 기반 페이지네이션 (`createdAt` + `id` 쌍)

---

## 테스트 Stub 스켈레톤

```typescript
function createNotificationsRepositoryStub(options?: {
  notification?: { id: string; userId: string; isRead: boolean } | null;
  onMarkRead?: (notificationId: string, tx: unknown) => void;
  onDeleteNotification?: (notificationId: string, tx: unknown) => void;
}): NotificationsRepository {
  return {
    async findNotifications(_userId, _query, _tx) {
      return { items: [], meta: { count: 0, take: 20, cursor: null, next: null } };
    },
    async findNotificationById(_id, _tx) {
      return options?.notification !== undefined ? options.notification : DEFAULT_NOTIFICATION;
    },
    async markRead(notificationId, tx) {
      options?.onMarkRead?.(notificationId, tx);
      return { notificationId, isRead: true };
    },
    async deleteNotification(notificationId, tx) {
      options?.onDeleteNotification?.(notificationId, tx);
      return { notificationId };
    },
    // ... 나머지
  };
}
```

완전한 stub은 `jamplay/backend/src/modules/notifications/notifications.service.spec.ts` 참고.
