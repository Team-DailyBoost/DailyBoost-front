# DailyBoost-server

# 프로젝트 소개
매일 반복되는 "오늘은 무엇을 먹을까? 오늘은 어떤 운동할까?" 이러한 많은 고민은 피로를 만들고,
결국엔 배달이나 인스턴스 같은 비건강한 선택으로 이어집니다.
또한 운동만 하거나 식단만 관리하는 경우 목표 달성이 느려지고, 
초보자는 정보 과잉과 복잡한 계획 때문에 쉽게 포기하게 됩니다.

DailyBoost는 이러한 문제를 운동과 식단을 동시에 관리하고 
AI 기반 추천을 통해 효율적인 목표 달성을 돕는 모바일 서비스입니다.

## 프로젝트 목표
- 초보자도 쉽게 시작할 수 있는 자동 추천 시스템
- 복잡한 계획 없이 지속 가능한 건강 습관 형성
- 커뮤니티 기능과 도전과제을 통한 동기부여 및 참여 유도

<h2 align="center">🧑‍💻 Team Members</h2>

<table align="center">
  <tr>
    <td align="center" width="200">
      <a href="https://github.com/mirae7199">
        <img src="https://github.com/mirae7199.png" width="120" />
      </a>
      <br />
      <b>김미래</b>
      <br />
      Backend
    </td>
    <td align="center" width="200">
      <a href="https://github.com/useirpwfld">
        <img src="https://github.com/useirpwfld.png" width="120" />
      </a>
      <br />
      <b>이기석<b>
      <br />
      Frontend
    </td>
    <td align="center" width="200">
      <a href="https://github.com/exia-00">
        <img src="https://github.com/exia-00.png" width="120" />
      </a>
      <br />
      <b>유지환</b>
      <br />
      Ideation
    </td>
  </tr>

  <tr>
    <td align="center">
      <a href="https://github.com/lhs312277">
        <img src="https://github.com/lhs312277.png" width="120" />
      </a>
      <br />
      <b>임현성</b>
      <br />
      UI/UX
    </td>
    <td align="center">
      <a href="https://github.com/gudtjr0811-alt">
        <img src="https://github.com/gudtjr0811-alt.png" width="120" />
      </a>
      <br />
      <b>장지현</b>
      <br />
      UI/UX
    </td>
  </tr>
</table>


## 주요 기능
- AI 기반 운동 · 식단 추천 (Spring AI + Gemini AI API 활용)
  - 사용자의 나이, 체형, 목표(다이어트, 근육 증가.. 등)를 기반으로 추천
  - 개인 맞춤 운동 루틴 및 식단 자동 추천
 
- 로그인 & 인증
   - JWT 기반 인증
   - OAuth2 소셜 로그인
   - 사용자의 진입 장벽을 낮추고 빠른 서비스 이용 가능

- 커뮤니티 기능
   - 운동, 음식, 식단, 대회로 나뉜 게시판 제공
   - 사용자 간 정보 공유 및 소통 가능
- 대회 게시판
   - 운동한 몸 사진 업로드하여 투표를 통해 순위 결정
   - 1위 사용자를 우승으로 하여 사용자끼리의 경쟁과 참여 유도
- 도전과제
   - 도전과제를 사용자가 직접 생성하여 참여
   - 다른 사용자가 만든 도전과제 참여 가능
   - 도전과제 완료 시 티어 경험치 획득 (참여 유도)
 
## 기술 스택

### Backend
- Java 21
- Spring Boot 3.5.5
- Spring Security
- Spring AI
- Spring Data JPA
- JWT / OAuth2
- MySQL 
- Redis (계정 복구 인증 코드)
- SMTP (Simple Mail Transfer Protocal)

### Frontend
- TypeScript
- React Native (Expo)
- Axios (API 통신)

### Infra
- Linux (Ubuntu)
- Nginx (Reverse Proxy 구성 및 HTTPS(SSL) 적용)

# 구현 사항
---
## 로그인
![login](https://github.com/user-attachments/assets/53fdbb89-6c7f-4ae4-89be-be2089efe9cb)
## 운동 추천
![exercise](https://github.com/user-attachments/assets/c63a623f-60e6-4c18-8be5-3fbce6f2a72d)
## 식단 추천
![food](https://github.com/user-attachments/assets/7e3692f2-85cb-48f7-8818-60a7e42f88df)
## 게시판
![게시판](https://github.com/user-attachments/assets/d388ce33-21e4-4d49-9295-b7cfd48639b9)
## 대회
![대회](https://github.com/user-attachments/assets/2347003c-d88b-4fd9-abf6-516535cbeaf4)
## 도전과제
![도전과제](https://github.com/user-attachments/assets/4ce78a5e-ce90-4fcd-8043-9ea3e69049a1)

## 도식화
<img width="1001" height="555" alt="image" src="https://github.com/user-attachments/assets/d53219ce-b731-4f5a-94b2-9e688ae691ec" />

## 개발 기간
2025.9.13 ~ 12.01
