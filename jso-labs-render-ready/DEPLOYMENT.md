# GitHub → Render checklist

1. Create a GitHub repository, e.g. `jso-labs`.
2. Upload the CONTENTS of this folder so `jso-landing-page`, `jso-ai-seo-audit`, `ai-chat-studio`, `render.yaml`, and `README.md` are at repository root.
3. In Render, connect the GitHub repository.
4. Use Blueprint deployment if Render detects `render.yaml`, or create three services manually using the Root Directories shown in `README.md`.
5. Add `OPENAI_API_KEY` only in Render Environment Variables if needed.
6. After deployment, test `/`, `/signup`, `/login`, `/dashboard` on SEO Audit and `/health` on Chat Studio.
7. If Render assigns different URLs, replace them in `jso-landing-page/config.js`.
