# Frontend README

Location: `frontend/`

Purpose
- Next.js (App Router) + TypeScript frontend for customers and admin.

Quick dev (local)

```bash
cd frontend
# set NODE environment and port if needed; default dev script uses port 3000
# to run on 8088 (recommended proxy port) on Windows PowerShell:
Set-Item Env:PORT 8088
npm run dev

# or in bash
PORT=8088 npm run dev
```

Notes
- The frontend expects a runtime API host at `NEXT_PUBLIC_API_URL` — for local Docker stack this should point to `http://localhost:8000/api`.
- If admin pages show `Forbidden` or empty lists, check that the browser has a valid admin JWT token in `localStorage` and that the token is not expired. You can get a fresh token using `backend/scripts/admin_check.php`.

If you want me to change the dev script to default to port 8088 or add a convenience npm script like `npm run dev:8088`, say so and I will patch `package.json` accordingly.
