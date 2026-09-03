@echo off
node "%~dp0..\bootstrap\cli.mjs" %*
exit /b %errorlevel%
