# 텔레그램 봇 설정 (5분 소요)

## 1단계 — 봇 생성

1. 텔레그램에서 @BotFather 검색 후 대화 시작
2. /newbot 입력
3. 봇 이름 입력: 앤팅 알림봇
4. 봇 아이디 입력: anting_alert_bot (중복이면 다른 이름)
5. 발급된 토큰 복사 → NEXT_PUBLIC_TELEGRAM_BOT_TOKEN에 입력

## 2단계 — Chat ID 확인

1. 위에서 만든 봇과 대화 시작 (텔레그램에서 봇 검색)
2. 아무 메시지나 전송
3. 브라우저에서 아래 URL 접속:
https://api.telegram.org/bot{토큰}/getUpdates
4. result[0].message.chat.id 값 복사
→ NEXT_PUBLIC_TELEGRAM_CHAT_ID에 입력

## 3단계 — 테스트

가입 테스트 후 텔레그램에 메시지 오는지 확인
