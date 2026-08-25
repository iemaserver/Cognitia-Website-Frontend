# Cognitia Website Frontend

Official frontend for the Cognitia 2k26 event experience. The app is built as a retro handheld-console themed single-page application with registration, login, dashboard, admin, informational cartridges, and PWA support.

## Tech stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build tool:** Vite 6
- **Styling:** Tailwind CSS 4, custom CSS
- **Animation/UI:** Motion, Lucide React
- **PWA support:** Web manifest + custom service worker
- **Hosting:** Firebase Hosting
- **CI/CD:** GitHub Actions

## Project structure

```text
Cognitia-Website-Frontend/
├── .github/
│   └── workflows/
│       └── build_and_deploy.yml    # Main CI/CD pipeline
├── public/
│   ├── manifest.json               # PWA manifest
│   └── sw.js                       # Service worker
├── scripts/
│   ├── aws-bucket-policy.json      # Legacy AWS S3 bucket policy
│   ├── aws-cors-policy.json        # Legacy AWS S3 CORS policy
│   └── deploy-to-aws.ps1           # Legacy AWS deployment/provisioning script
├── src/
│   ├── components/
│   │   ├── cartridges/             # Screen-level cartridge modules
│   │   └── ...                     # Shared UI building blocks
│   ├── services/
│   │   └── awsService.ts           # Client-side registration/storage/upload service
│   ├── utils/
│   │   └── audio.ts                # Sound helpers
│   ├── App.tsx                     # Main application shell and cartridge routing
│   ├── index.css                   # Global styles
│   ├── main.tsx                    # App bootstrap + service worker registration
│   ├── pwaRegister.ts              # PWA install and SW registration helpers
│   └── types.ts                    # Shared TypeScript types
├── deploy.bat                      # Legacy Windows AWS deploy helper
├── firebase.json                   # Firebase Hosting config
├── index.html                      # Vite HTML entry
├── metadata.json                   # Project metadata
├── package.json                    # Scripts and dependencies
├── tsconfig.json                   # TypeScript config
└── vite.config.ts                  # Vite, React, Tailwind, alias config
```

## Application architecture

- `src/App.tsx` drives the retro console shell, cartridge switching, keyboard shortcuts, boot flow, and top-level UI state.
- `src/components/cartridges/` contains feature screens such as dashboard, rules, tracks, timeline, sponsors, members, registration, login, FAQ, prizes, and admin.
- `src/services/awsService.ts` manages client-side team registration, login state, submission data, and upload handling using browser storage. It also reads optional `VITE_AWS_S3_BUCKET` and `VITE_AWS_REGION` values for upload-related configuration.
- `public/sw.js` and `src/pwaRegister.ts` provide offline caching and install-prompt behavior for the PWA experience.

## Local development

### Prerequisites

- Node.js (v22)
- npm

### Install dependencies

```bash
npm ci
```

### Available scripts

```bash
npm run dev      # Start Vite dev server on port 3000
npm run build    # Create production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # TypeScript type-check (tsc --noEmit)
```

## Deployment strategy

### Primary production deployment

Production deployment is handled by **GitHub Actions + Firebase Hosting**:

1. A push to the `main` branch triggers `.github/workflows/build_and_deploy.yml`.
2. The **build** job runs `npm ci` and `npm run build`.
3. The generated `dist/` folder is uploaded as a workflow artifact.
4. The **deploy** job downloads the artifact and deploys it to Firebase Hosting using `FirebaseExtended/action-hosting-deploy`.
5. `firebase.json` serves `dist/` and rewrites all routes to `/index.html`, which supports SPA-style client routing.

Required GitHub secrets for deployment:

- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_PROJECT_ID`

## Notes

- The app is configured as a single-page application and a progressive web app.
- The Vite config enables React and Tailwind CSS, and exposes the `@` alias to the repository root.
- The current validation script is `npm run lint`, which performs TypeScript type-checking rather than ESLint-based linting.
