# AI Chat Studio

একটা free, self-hosted ChatGPT-এর মতো ওয়েব অ্যাপ — OpenAI (GPT) এবং Anthropic (Claude) দুটোই সাপোর্ট করে।

## ফিচার
- 💬 Text চ্যাট (streaming response, দুই provider থেকে বেছে নেওয়া যায়)
- 🎨 ছবি তৈরি (OpenAI DALL·E 3)
- 📎 ফাইল/PDF আপলোড ও পড়া (চ্যাটে context হিসেবে যোগ হয়)
- 🎤 ভয়েস ইনপুট ও 🔊 ভয়েস আউটপুট (ব্রাউজারের নিজস্ব Web Speech API — সম্পূর্ণ ফ্রি)
- প্রতিটা user নিজের API key ব্যবহার করে (browser এর localStorage-এ থাকে, আপনার সার্ভারে জমা হয় না) — তাই আপনি free publish করলেও আপনার নিজের বিল আসবে না।
- একাধিক conversation সংরক্ষণ (browser-ভিত্তিক)

## লোকালি রান করা
```bash
npm install
npm start
```
তারপর ব্রাউজারে খুলুন: http://localhost:3000

## GitHub-এ পাবলিশ করা
```bash
git init
git add .
git commit -m "Initial commit: AI Chat Studio"
git branch -M main
git remote add origin https://github.com/<আপনার-username>/ai-chat-studio.git
git push -u origin main
```

## Render-এ free deploy করা
1. https://render.com এ যান, GitHub দিয়ে sign in করুন।
2. **New +** → **Web Service** ক্লিক করুন।
3. আপনার GitHub repo (ai-chat-studio) সিলেক্ট করুন।
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. **Create Web Service** ক্লিক করুন — কয়েক মিনিটে আপনার অ্যাপ লাইভ হয়ে যাবে (একটা `.onrender.com` URL পাবেন)।

> এই repo-তে থাকা `render.yaml` ফাইলটি ব্যবহার করে Render Blueprint দিয়েও এক ক্লিকে deploy করতে পারবেন (Render Dashboard → New + → Blueprint)।

## ব্যবহারকারীরা কীভাবে ব্যবহার করবে
1. অ্যাপ খুলে ⚙ **সেটিংস**-এ ক্লিক করবে।
2. Provider বেছে নেবে (OpenAI বা Anthropic)।
3. নিজের API key পেস্ট করবে:
   - OpenAI key: https://platform.openai.com/api-keys
   - Anthropic key: https://console.anthropic.com/settings/keys
4. সংরক্ষণ করে চ্যাট শুরু করবে।

## গুরুত্বপূর্ণ নোট
- Render-এর free plan কিছুক্ষণ inactive থাকলে "sleep" হয়ে যায় — প্রথম রিকোয়েস্টে ২০–৩০ সেকেন্ড লাগতে পারে জেগে উঠতে। এটা free tier-এর স্বাভাবিক আচরণ।
- ভয়েস ইনপুট মূলত Chrome/Edge ব্রাউজারে ভালো কাজ করে (Web Speech API)।
- Image generation-এর জন্য OpenAI API key-এ billing enabled থাকতে হবে (DALL·E ফ্রি না, কিন্তু খরচ user-এর নিজের key থেকে হয়)।
- এই অ্যাপ কোনো API key সার্ভারে জমা রাখে না — সবকিছু client-side এ থাকে, তাই privacy-friendly এবং আপনার হোস্টিং খরচ শূন্য।

## Folder Structure
```
ai-chat-studio/
├── server.js          # Express backend (proxy + file parsing)
├── package.json
├── render.yaml
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```
