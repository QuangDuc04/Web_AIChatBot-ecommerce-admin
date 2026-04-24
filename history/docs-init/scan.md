# Codebase Scan Report

## Project Type
Node.js / TypeScript — React SPA (single-package, Vite)

## Structure
```
ecommerce-admin/
├── src/
│   ├── api/                 # 17 API modules + axios instance
│   ├── components/
│   │   └── ui/              # UI primitives
│   ├── context/             # AuthContext
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # AdminLayout, AuthLayout
│   ├── lib/                 # Utility functions
│   └── pages/
│       ├── analytics/
│       ├── auth/
│       ├── banners/
│       ├── brands/
│       ├── categories/
│       ├── conversations/
│       ├── coupons/
│       ├── dashboard/
│       ├── flash-sales/
│       ├── notifications/
│       ├── orders/
│       ├── payments/
│       ├── products/
│       ├── reviews/
│       ├── settings/
│       └── shipments/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .env / .env.example
└── README.md
```

## Key Directories
| Directory         | Purpose                                    |
| ----------------- | ------------------------------------------ |
| src/api/          | Axios instance + 17 feature API modules    |
| src/components/   | Shared UI components (Sidebar, Header...)  |
| src/components/ui/| Reusable primitives (Modal, Spinner...)    |
| src/context/      | AuthContext — global auth state            |
| src/hooks/        | Custom hooks (useDebounce)                 |
| src/layouts/      | AdminLayout, AuthLayout wrappers           |
| src/lib/          | Utility functions (formatCurrency, etc.)   |
| src/pages/        | 16 feature page modules                    |
| dist/             | Production build output                    |

## Existing Docs
- README.md: exists (Vietnamese, comprehensive)
- AGENTS.md: missing
- CLAUDE.md: missing
- docs/: missing

## Entry Points
- `index.html` → root HTML
- `src/main.tsx` → React bootstrap (QueryClient + Toaster)
- `src/App.tsx` → routing with React Router v6
- `src/api/axios.ts` → Axios client with auth interceptors + token refresh

## Dependencies
- React 18.2.0
- React Router v6.20.0
- @tanstack/react-query 5.13.4
- axios 1.6.2
- react-hook-form 7.49.2 + zod 3.22.4
- recharts 2.10.3
- lucide-react 0.294.0
- react-hot-toast 2.4.1
- date-fns 3.0.6
- @headlessui/react 1.7.17
- tailwind-merge + clsx
- Vite 5.0.8, TypeScript 5.2.2, Tailwind CSS 3.3.6

## Security Signals
- Handles payment data: yes (src/pages/payments/, src/api/payments.ts — giao dịch, COD, hoàn tiền)
- Handles health/medical data: no
- Has user accounts/PII: yes (auth, user roles admin/staff, localStorage tokens)
- Has multi-tenancy: no
- Serves EU users: unknown
- Serves Vietnamese users: yes (README in Vietnamese, currency formatting)
