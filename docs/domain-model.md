# 아고라 도메인 모델 (Domain Model)

> **본 문서는 아고라 프로젝트의 공통 용어를 정의한다.**
>
> 구현 방식보다 **용어의 의미를 고정하는 것**이 목적이다.
>
> 기획, 개발, AI는 모두 이 문서를 기준으로 동일한 용어를 사용한다.

---

## 핵심 도메인 객체

### Comment (댓글)

게시글에 달리는 개별 의견. 아고라에서 토론이 시작되는 가장 원초적인 단위이다.

댓글 자체는 순수한 데이터 객체이며, 특정 화면(게시판, 토론방 관전석 등)에서 필요한 상태는 ViewModel로 확장한다.

### Proposal (토론 제안)

한 사용자가 다른 사용자의 Comment(또는 Post)를 보고 **정식 1:1 토론을 신청하는 행위의 산물**이다.

Proposal은 수락/거절/만료의 생명주기를 가지며, 수락될 경우 Debate를 생성한다.

### Debate (토론)

두 명의 토론자가 하나의 주제에 대해 턴을 주고받는 **정식 토론 세션**이다.

Debate는 토론의 메타 정보(주제, 참여자, 상태)만 관리하며, 실제 발언 내용은 Turn이 담당한다.

### Turn (발언)

토론 내에서 이루어지는 **개별 발언 한 건**. 토론의 최소 단위이다.

Turn은 상대방의 이전 발언 일부를 인용(Quote)할 수 있으며, 이 인용 관계는 `quotedTurnId`와 인용된 텍스트(`quotedExcerpt`)로 표현된다.

### Notification (알림)

시스템이 사용자에게 전달하는 **이벤트 알림**이다.

Proposal 수신, Turn 도착, Debate 종료 등 사용자의 행동이 필요한 시점에 생성된다.

---

## 객체 간 관계

```
Comment ──(제안)──▷ Proposal ──(수락)──▷ Debate ──(구성)──▷ Turn
                       │                    │
                       ▽                    ▽
                   Notification          Notification
                  (제안 수신 알림)      (턴 도착 / 종료 알림)
```

| 관계 | 설명 |
|------|------|
| Comment → Proposal | 사용자가 특정 댓글에 대해 토론을 제안하면 Proposal이 생성된다 |
| Proposal → Debate | Proposal이 수락되면 Debate가 개설된다 |
| Debate → Turn | 하나의 Debate는 여러 개의 Turn으로 구성된다 |
| Turn → Turn (인용) | Turn은 이전 Turn의 일부를 인용(Quote)하여 참조할 수 있다 |
| Proposal / Debate → Notification | 주요 이벤트 발생 시 관련 사용자에게 Notification이 생성된다 |

---

## ViewModel (화면별 확장 타입)

도메인 객체는 순수한 데이터 구조를 유지하되, 특정 화면에서 필요한 UI 상태는 ViewModel로 확장한다.

| ViewModel | 기반 도메인 | 추가되는 필드 | 사용처 |
|-----------|------------|--------------|--------|
| BoardComment | Comment | `hasDebate`, `debateStatus` | 자유게시판 댓글 목록 |

---

## 보조 개념

### DraftDebate (임시 컨텍스트 셔틀)

DraftDebate는 도메인 객체가 아니다.

게시판에서 제안서 화면으로 넘어갈 때 **페이지 간 컨텍스트를 잠시 전달하기 위한 일회성 메모리 데이터**이다.

토론이 생성되거나 페이지를 이탈하면 즉시 소멸한다.
