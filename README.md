<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1AwfM16bctlYRKXad0ynkJobh1xvWLoWa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

   # Imitation Hexagon (Web Game)

배포 링크: https://<YOUR_DOMAIN>

## 소개
웹캠 손 제스처(또는 포즈 인식)를 활용해 조작하는 미니 게임입니다.
React + Vite 기반으로 제작했고, Three.js(R3F)로 씬을 렌더링합니다.

## 주요 기능
- 웹캠 기반 인식으로 게임 조작
- 장애물/패턴 회피 게임플레이
- 점수/생존 시간 기록

## 기술 스택
- React, TypeScript, Vite
- three.js, @react-three/fiber, drei
- MediaPipe Tasks Vision
- Vercel Deploy

## 실행 방법 (로컬)
```bash
npm install
npm run dev

