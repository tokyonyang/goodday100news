# KR 48시간·날씨·동명이인 보정 내역

이 수정본은 `goodday100news-main(1).zip` 기준으로 다음을 반영했습니다.

## 핵심 수정

1. 기본 지역/언어/시간대
   - `DEFAULT_REGION=KR`
   - `DEFAULT_LOCALE=ko-KR`
   - `DEFAULT_TIMEZONE=Asia/Seoul`

2. 뉴스 근거자료 제한
   - `SUPPORTING_NEWS_MAX_AGE_HOURS=48`
   - Google News RSS 검색어에 `when:2d` 자동 추가
   - 수신 후 발행시각 기준으로 48시간 초과 기사 재차 제외
   - 발행시각 미확인 기사는 기본 제외

3. 날씨 정보
   - Open-Meteo 기반 API 키 없는 날씨 조회
   - 기본 지역 서울
   - 모닝 브리핑에 날씨 섹션 포함
   - `/topic 오늘 날씨` 요청 시 날씨 정보 포함

4. 동명이인 방지
   - 2~4글자 한국어 인물명 가능 키워드 감지
   - 기사 제목의 직함/소속/분야/사건 맥락어 확인
   - 맥락이 섞이면 동명이인 가능성 경고

5. 텔레그램 링크 버튼
   - 기사 URL을 본문에서 제거
   - `🔗 참고 기사 바로가기` 버튼으로 분리

6. 모닝브리핑 시간
   - Vercel Cron: `57 20 * * *`
   - 한국시간: 오전 5시 57분

## 배포 후 확인

1. Vercel 환경변수를 추가/수정합니다.
2. Redeploy 합니다.
3. 아래 주소로 점검합니다.

```text
https://your-vercel-domain.vercel.app/api/debug-webhook?secret=SETUP_SECRET
https://your-vercel-domain.vercel.app/api/test-news?secret=SETUP_SECRET&q=오늘%20날씨
```

4. 텔레그램에서 테스트합니다.

```text
/topic 오늘 날씨
/topic 원달러 환율
/topic 안정환
```
