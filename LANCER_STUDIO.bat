@echo off
title GlassLyric Studio - Createur de Videos TikTok
cd /d "%~dp0"
echo ========================================================
echo   Demarrage de GLASS LYRIC STUDIO (TikTok 9:16)
echo ========================================================
start "" "http://localhost:5173"
npm run dev
pause

