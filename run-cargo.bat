@echo off
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul 2>&1
set PATH=C:\Users\derpy\.cargo\bin;C:\Program Files\nodejs;%PATH%
cd /d C:\Users\derpy\Desktop\projects\visualiser\src-tauri
cargo check > C:\Users\derpy\Desktop\projects\visualiser\cargo-output.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> C:\Users\derpy\Desktop\projects\visualiser\cargo-output.txt
