@echo off
chcp 65001 >nul
echo ========================================================
echo    সমিতি ৩৬০ (Somiti 360) - গিটহাবে পুশ করার স্বয়ংক্রিয় স্ক্রিপ্ট
echo ========================================================
echo.
echo ১. সর্বশেষ কোড সিঙ্ক করা হচ্ছে...
node scripts/sync_somiti_repo.cjs
echo.
echo ২. গিটহাব রিপোজিটরিতে কোড পাঠানো হচ্ছে...
cd somiti-360
git add .
git commit -m "feat(somiti-360): update somiti management platform"
git push -u origin main
echo.
echo ========================================================
if %ERRORLEVEL% EQU 0 (
    echo অভিনন্দন! সমিতি ৩৬০ সফলভাবে GitHub-এ আপলোড হয়েছে!
    echo দেখুন: https://github.com/sajjadhossan/somiti-360
) else (
    echo পুশ করতে সমস্যা হয়েছে। দয়া করে নিশ্চিত করুন GitHub-এ
    echo 'somiti-360' নামে রিপোজিটরিটি তৈরি করা রয়েছে এবং ইন্টারনেট সংযোগ চালু আছে।
)
echo ========================================================
pause
