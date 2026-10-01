# 📁 Google Drive অটো-ব্যাকআপ মাস্টার গাইড (A to Z)
> ভবিষ্যতের যেকোনো ওয়েব বা সফটওয়্যার প্রজেক্টে ব্যবহারের জন্য ১০০% ফ্রি ও সম্পূর্ণ গাইড।

---

## 📑 সূচিপত্র
1. [পদ্ধতি ১: Google Cloud Console (OAuth 2.0 Client ID) - ১-ক্লিক পারমিশন পদ্ধতি](#পদ্ধতি-১-google-cloud-console-oauth-20-client-id)
2. [পদ্ধতি ২: Google Apps Script (Webhook) - সম্পূর্ণ নো-কার্ড ও স্ক্রিপ্ট পদ্ধতি](#পদ্ধতি-২-google-apps-script-webhook)
3. [সাধারণ সমস্যা ও তাৎক্ষণিক সমাধান (Troubleshooting)](#সাধারণ-সমস্যা-ও-সমাধান)
4. [কোড ব্যবহারের নিয়মাবলী](#কোড-ব্যবহারের-নিয়মাবলী)

---

## 🚀 পদ্ধতি ১: Google Cloud Console (OAuth 2.0 Client ID)
*ব্যবহারকারী অ্যাপে শুধু **"Connect Google Drive"** বাটনে চাপবেন, গুগলের লগইন পপআপ আসবে এবং ১-ক্লিকে ড্রাইভে ফাইল সেভ হবে।*

### ধাপ ১: প্রজেক্ট তৈরি
1. ব্রাউজারে যান: [console.cloud.google.com](https://console.cloud.google.com)
2. সাধারণ জিমেইল দিয়ে লগইন করুন (কোনো ক্রেডিট কার্ড লাগবে না)।
3. উপরে বাম পাশে প্রজেক্ট ড্রপডাউন ➔ **`NEW PROJECT`**-এ ক্লিক করুন।
4. **Project Name** দিন (যেমন: `My-Drive-Backup-App`) এবং **`CREATE`**-এ চাপুন।

### ধাপ ২: Google Drive API চালু করা
1. বাম পাশের মেনু থেকে **APIs & Services** ➔ **Enabled APIs & Services**-এ যান।
2. উপরে **`+ ENABLE APIS AND SERVICES`** বাটনে ক্লিক করুন।
3. সার্চ বক্সে লিখুন: `Google Drive API`
4. রেজাল্ট থেকে **Google Drive API** সিলেক্ট করে **`ENABLE`** বাটনে ক্লিক করুন।

### ধাপ ৩: OAuth Consent Screen তৈরি
1. বাম মেনু থেকে **APIs & Services** ➔ **OAuth consent screen**-এ যান।
2. **User Type** সিলেক্ট করুন: **`External`** ➔ **`CREATE`** চাপুন।
3. ফর্ম পূরণ করুন:
   - **App name:** আপনার অ্যাপের নাম (যেমন: `HisabKitab 360`)
   - **User support email:** আপনার জিমেইল সিলেক্ট করুন
   - **Developer contact email:** আপনার জিমেইল লিখুন
4. নিচে **`SAVE AND CONTINUE`** চাপুন।
5. **Scopes** ধাপে সরাসরি নিচে স্ক্রোল করে **`SAVE AND CONTINUE`** চাপুন।
6. **Test users (খুব গুরুত্বপূর্ণ):**
   - **`+ ADD USERS`** বাটনে ক্লিক করুন।
   - যে জিমেইল দিয়ে টেস্ট করবেন, সেটি লিখে **Save** করুন।
7. **`SAVE AND CONTINUE`** দিয়ে শেষ করুন।

### ধাপ ৪: OAuth Client ID তৈরি
1. বাম পাশের মেনু থেকে **Credentials** (🔑)-এ যান।
2. উপরে **`+ CREATE CREDENTIALS`** ➔ **`OAuth client ID`** সিলেক্ট করুন।
3. **Application type:** `Web application` সিলেক্ট করুন।
4. **Authorized JavaScript origins:**
   - **`+ ADD URI`** ক্লিক করে লিখুন: `http://localhost:5173`
   - (ভবিষ্যতে Vercel-এ দিলে Vercel ডোমেইন যেমন: `https://my-app.vercel.app` যোগ করবেন)।
5. **`CREATE`** বাটনে চাপুন।
6. স্ক্রিনে পাওয়া **Client ID** কপি করে নিন।

---

## ⚡ পদ্ধতি ২: Google Apps Script (Webhook)
*কোনো ক্লাউড কনসোল বা ক্রেডেনশিয়াল ছাড়া, মাত্র ১ মিনিটের ১০০% ফ্রি সমাধান।*

### ধাপ ১: স্ক্রিপ্ট তৈরি
1. ব্রাউজারে যান: [script.google.com](https://script.google.com)
2. বাম পাশে **`+ New project`** এ ক্লিক করুন।
3. এডিটরের সব লেখা মুছে দিয়ে নিচের কোড পেস্ট করুন:

```javascript
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var folderName = "HisabKitab-360-Backups";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    var dateStr = Utilities.formatDate(new Date(), "GMT+6", "yyyy-MM-dd_HH-mm");
    var filename = "backup_" + dateStr + ".json";
    var file = folder.createFile(filename, JSON.stringify(payload, null, 2), "application/json");
    return ContentService.createTextOutput(JSON.stringify({ status: "success", fileId: file.getId() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### ধাপ ২: ওয়েব অ্যাপ ডিপ্লয় ও লিঙ্ক তৈরি
1. উপরে ডানপাশে **`Deploy`** ➔ **`New deployment`** এ ক্লিক করুন।
2. গিয়ার আইকন (⚙️) থেকে **`Web app`** সিলেক্ট করুন।
3. সেটিংস:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. **`Deploy`** চাপুন ➔ **Authorize access** দিয়ে পারমিশন দিন (Advanced ➔ Go to project ➔ Allow)।
5. পাওয়া **Web app URL** টি কপি করে নিন।

---

## 🛠️ সাধারণ সমস্যা ও সমাধান (Troubleshooting)

### সমস্যা ১: `Error 403: access_denied` / App is being tested
- **কারণ:** অ্যাপটি Testing মোডে রয়েছে এবং আপনার জিমেইল Test Users লিস্টে নেই।
- **সমাধান:** 
  1. `console.cloud.google.com` ➔ **OAuth consent screen** ➔ **Test users** এ গিয়ে **`+ ADD USERS`** দিয়ে আপনার জিমেইল যোগ করুন।
  2. **অথবা স্থায়ী সমাধান:** একই পেজের উপরে থাকা **`PUBLISH APP`** বাটনে ক্লিক করে Confirm করুন।

### সমস্যা ২: `Google hasn't verified this app` (সতর্কতা)
- **সমাধান:** পপআপের নিচে থাকা **Advanced** লিংকে ক্লিক করুন ➔ **Go to HisabKitab 360 (unsafe)** ➔ **Continue / Allow** চাপুন।

### সমস্যা ৩: লোকালহোস্ট ছাড়া Vercel বা লাইভ সাইটে কাজ করছে না
- **সমাধান:** Google Console ➔ Credentials ➔ আপনার তৈরি Web Client এ গিয়ে **Authorized JavaScript origins** এ আপনার Vercel বা লাইভ সাইটের URL (যেমন: `https://my-app.vercel.app`) যোগ করুন।

---

## 💻 কোড ব্যবহারের নিয়মাবলী

### HTML ফাইলের `<head>` ট্যাগে:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### জাভাস্ক্রিপ্টে OAuth কানেক্ট ও অ্যাকাউন্ট সিলেক্ট:
```javascript
const client = window.google.accounts.oauth2.initTokenClient({
  client_id: "YOUR_CLIENT_ID",
  scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile",
  prompt: "select_account",
  callback: (response) => {
    if (response.access_token) {
      // access_token দিয়ে সরাসরি Google Drive REST API-তে ফাইল আপলোড করবেন
    }
  }
});

// কানেক্ট বাটন ক্লিকে কল করুন:
client.requestAccessToken({ prompt: 'select_account' });
```
