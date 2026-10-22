@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"
title সমিতি ৩৬০ - লোকালহোস্ট প্রিভিউ সার্ভার

cls
echo ===================================================================
echo             সমিতি ৩৬০ (Somiti 360) - লোকাল ও মোবাইল প্রিভিউ
echo ===================================================================
echo.
echo [1] নোড এনভায়রনমেন্ট ও ফাইল যাচাই করা হচ্ছে...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] আপনার কম্পিউটারে Node.js ইনস্টল পাওয়া যায়নি!
    echo অনুগ্রহ করে https://nodejs.org থেকে Node.js ইনস্টল করে পুনরায় চেষ্টা করুন।
    echo.
    pause
    exit /b 1
)

echo [2] সমিতি ৩৬০ লোকাল প্রিভিউ সার্ভার চালু হচ্ছে...
echo.
node somiti_preview_server.cjs

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] সার্ভার অপ্রত্যাশিতভাবে বন্ধ হয়ে গেছে।
    pause
)
