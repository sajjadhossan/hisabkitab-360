# 💼 HisabKitab 360 | হিসাবকিতাব ৩৬০

> **পরিপূর্ণ ব্যক্তিগত ও ব্যবসায়িক অপারেটিং সিস্টেম (Personal & Business ERP OS)**  
> দ্বৈত মোড (Dual Mode), দ্রুতগতির পিওএস টার্মিনাল, ক্লাউড অটো-ব্যাকআপ, ক্যাশ ও ড্রয়ার কন্ট্রোল এবং অফলাইন সাপোর্ট সমৃদ্ধ আধুনিক প্ল্যাটফর্ম।

---

## 📥 ডাউনলোড ও ইন্সটলেশন (Releases & Downloads)

এই রিপোজিটরির `releases/` ফোল্ডারে পিসি এবং মোবাইল সংস্করণের প্রস্তুত ফাইলগুলো রাখা হয়েছে:

| প্ল্যাটফর্ম | ফাইল ফরম্যাট | সাইজ | ডাউনলোড লিংক |
| :--- | :---: | :---: | :--- |
| 🖥️ **Windows PC** | `.exe` (Standalone Desktop) | ~865 KB | [`releases/HisabKitab-360-PC.exe`](./releases/HisabKitab-360-PC.exe) |
| 📱 **Android Mobile** | `.apk` (Direct Install) | ~1.03 MB | [`releases/HisabKitab-360.apk`](./releases/HisabKitab-360.apk) |
| 🌐 **Live Web App** | Cloud Hosted | 0 KB | [Vercel Deployment Guide](#-vercel-এ-লাইভ-হোস্টিং) |

---

## ⚡ প্রধান ফিচারসমূহ (Key Features)

- 🔄 **ট্রিপল অপারেটিং মোড (Operating Modes):**
  - **ডুয়েল মোড (Dual Mode):** একই সাথে ব্যক্তিগত বাজেট ও ব্যবসা পরিচালনা।
  - **শুধুমাত্র ব্যবসা (Business ERP Only):** ইনভেন্টরি, বারকোড স্ক্যানার, পিওএস, ভ্যাট/ডিসকাউন্ট, বাকির খাতা ও কর্মচারী বেতন।
  - **শুধুমাত্র পার্সোনাল (Personal Finance Only):** দৈনন্দিন বাজার ফর্দ, পারিবারিক খরচ, উৎসব/ইভেন্ট ও জমার হিসাব।
- 🛒 **সুপার-ফাস্ট পিওএস টার্মিনাল (POS Terminal):** কি-বোর্ড শর্টকাট, বারকোড গান স্ক্যানিং, ক্যাশ ড্রয়ার ও ব্লুটুথ থার্মাল প্রিন্ট সাপোর্ট।
- ☁️ **রিয়েল-টাইম ক্লাউড ব্যাকআপ:** গুগল ড্রাইভ ১-ক্লিক অটো-সিঙ্ক (সর্বোচ্চ ৩০টি স্ন্যাপশট ব্যাকআপ ধারণক্ষমতা)।
- 🛡️ **সুপার অ্যাডমিন ও মাস্টার কন্ট্রোল:** ভেন্ডর ও অ্যাডমিনের জন্য মাস্টার পিন সুরক্ষিত গ্লোবাল কন্ট্রোল প্যানেল।
- ⚡ **লাইটনিং স্পিড (60 FPS):** React 18 Concurrent Rendering, GPU Hardware Acceleration এবং Non-blocking Storage I/O।

---

## 🚀 Vercel-এ লাইভ হোস্টিং (Deploy to Vercel)

এই প্রজেক্টটিতে ইতিমধ্যে `vercel.json` কনফিগার করা আছে। ভার্সেলে হোস্টিং করার নিয়ম:

1. আপনার গিটহাব অ্যাকাউন্টে কোড পুশ করুন (নিচের নির্দেশিকা দেখুন)।
2. [Vercel](https://vercel.com) এ লগইন করে **"Add New Project"** এ ক্লিক করুন।
3. আপনার গিটহাব রিপোজিটরিটি সিলেক্ট করুন।
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **"Deploy"** বাটনে ক্লিক করুন। ২ মিনিটের মধ্যে সম্পূর্ণ অ্যাপটি বিশ্বব্যাপী লাইভ হয়ে যাবে!

---

## 🐙 গিটহাবে পুশ করার নিয়ম (Push to GitHub)

টার্মিনাল বা কমান্ড প্রম্পটে নিচের কমান্ডগুলো চালান:

```bash
# ১. গিট কমিট প্রস্তুত করা
git add .
git commit -m "feat: complete HisabKitab 360 with PC exe and Android APK releases"

# ২. আপনার রিমোট গিটহাব রিপোজিটরির লিংক যুক্ত করা (আপনার ইউজারনেম ও রেপো নাম দিন)
git remote add origin https://github.com/<YOUR-USERNAME>/hisabkitab-360.git

# ৩. গিটহাবে পুশ করা
git branch -M main
git push -u origin main
```

---

## 🛠️ লোকাল ডেভেলপমেন্ট (Local Development)

```bash
# ডিপেন্ডেন্সি ইন্সটল
npm install

# লোকাল ডেভ সার্ভার চালু
npm run dev

# প্রডাকশন বিল্ড তৈরি
npm run build

# অ্যান্ড্রয়েড সিঙ্ক (Capacitor)
npx cap sync android
```

---

© ২০২৬ **হিসাবকিতাব ৩৬০ টেকনোলজিস** | সর্বস্বত্ব সংরক্ষিত।
