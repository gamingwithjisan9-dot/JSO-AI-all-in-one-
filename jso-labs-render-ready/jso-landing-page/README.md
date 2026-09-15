# JSO Labs — Landing Page

একটা simple static landing page যা দুটো আলাদা প্রোডাক্টের দিকে নিয়ে যায়:
- **AI Chat Studio** (Node.js চ্যাট অ্যাপ) — নিজস্ব লগইন/সাইনআপ
- **JSO AI — SEO Audit** (Python Flask অ্যাপ) — নিজস্ব লগইন/সাইনআপ

দুটো প্রোডাক্টই আলাদা Render service হিসেবে deploy হবে; এই landing page শুধু তাদের সাথে লিংক করে।

## ধাপ ১ — দুটো অ্যাপ আলাদাভাবে deploy করুন
1. `ai-chat-studio` → GitHub repo বানিয়ে Render Web Service হিসেবে deploy করুন (আগের README অনুযায়ী)। একটা URL পাবেন, যেমন: `https://ai-chat-studio.onrender.com`
2. `JSO_AI_Phase1` (Flask অ্যাপ) → আলাদা GitHub repo বানিয়ে Render-এ deploy করুন:
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app` (নিচে নোট দেখুন)
   - **Plan:** Free
   একটা URL পাবেন, যেমন: `https://jso-ai-seo.onrender.com`

> ⚠️ Flask অ্যাপে `app.run(debug=True)` আছে যা শুধু লোকাল ডেভেলপমেন্টের জন্য। Render-এ production-এ চালাতে `gunicorn` লাগবে — নিচে "Flask deploy নোট" দেখুন।

## ধাপ ২ — এই landing page-এ URL বসান
`config.js` ফাইল খুলে দুটো আসল URL বসান:
```js
window.APP_URLS = {
  chatStudio: "https://ai-chat-studio.onrender.com",
  seoAudit: "https://jso-ai-seo.onrender.com",
};
```

## ধাপ ৩ — Landing page deploy করুন (Render Static Site — ফ্রি)
1. এই ফোল্ডারটা GitHub-এ push করুন (আলাদা repo, যেমন `jso-landing`)।
2. Render Dashboard → **New +** → **Static Site**।
3. আপনার repo সিলেক্ট করুন।
4. **Build Command:** খালি রাখুন (কিছু লাগবে না)
5. **Publish Directory:** `.`
6. Deploy করুন — একটা URL পাবেন, যেমন `https://jso-labs.onrender.com` — এটাই আপনার main landing page, যেখান থেকে ভিজিটর যেকোনো প্রোডাক্টে যেতে পারবে।

(বিকল্প: GitHub Pages / Netlify / Vercel দিয়েও এই static folder ফ্রি হোস্ট করা যায়।)

---

## Flask অ্যাপ deploy নোট (JSO AI)
`app.py`-এর একদম শেষ লাইন প্রোডাকশনের জন্য পরিবর্তন দরকার। `requirements.txt`-এ `gunicorn` যোগ করুন এবং Render-এর Start command এ এটা দিন:
```
gunicorn app:app
```
`requirements.txt` এ এক লাইন যোগ করুন:
```
gunicorn>=21,<22
```
এবং `.env` এ (Render Environment tab-এ) অবশ্যই বসান:
- `FLASK_SECRET_KEY` (লম্বা random string)
- `DATABASE_PATH=jso_ai.db`
- (ঐচ্ছিক) `OPENAI_API_KEY`

> নোট: Render-এর ফ্রি plan-এ disk ephemeral — মানে re-deploy হলে SQLite ডেটাবেজ (`jso_ai.db`) রিসেট হয়ে যেতে পারে। ইউজার ডেটা স্থায়ীভাবে রাখতে চাইলে Render-এর Postgres (ফ্রি tier আছে) ব্যবহার করার কথা ভাবুন — সেক্ষেত্রে `app.py`-এর sqlite3 অংশ পরিবর্তন করা লাগবে।
