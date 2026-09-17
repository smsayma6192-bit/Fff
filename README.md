# Dhonnobad AI Backend

এই folder-টি Dhonnobad AI Android V2-এর server-side backend। Vercel-এ deploy করার জন্য তৈরি।

## Files
- `api/chat.js` — AI chat + web search
- `api/image.js` — AI image generation
- `package.json` — OpenAI dependency
- `vercel.json` — Vercel function config
- `.env.example` — environment variable-এর উদাহরণ

## Vercel setup
1. GitHub-এ একটি নতুন repository তৈরি করো, যেমন `dhonnobad-ai-backend`।
2. এই folder-এর **ভেতরের সব files/folders** repository root-এ upload করো। `dhonnobad-ai-backend` folder-টি নিজে আরেকটি folder হিসেবে upload না করাই সহজ।
3. Vercel → New Project → ওই GitHub repository Import → Deploy.
4. Vercel Project Settings → Environment Variables-এ যোগ করো:
   - Name: `OPENAI_API_KEY`
   - Value: তোমার OpenAI API key
   - Environment: Production (প্রয়োজনে Preview/Development-ও)
5. Save করার পর Redeploy করো।
6. Vercel-এর project URL কপি করে Android app-এর `app/src/main/assets/config.js`-এ বসাও:

```js
window.DHONNOBAD_CONFIG = {
  BACKEND_URL: "https://তোমার-vercel-domain.vercel.app",
  APP_VERSION: "2.0.0"
};
```

## Security
OpenAI API key এই backend-এর server-side Environment Variable-এ থাকবে। Android app, `config.js`, HTML/JS বা GitHub repository-তে API key লিখবে না।
