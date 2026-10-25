@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Publier le site Cyber sur GitHub

where git >nul 2>nul
if errorlevel 1 (
  echo [X] Git n'est pas installe.
  echo     Installe-le depuis https://git-scm.com/download/win (Suivant partout^) puis relance ce fichier.
  start https://git-scm.com/download/win
  pause
  exit /b
)

if not exist ".git" (
  echo Premiere publication : connexion du dossier au depot GitHub...
  git init -b main >nul
  git remote add origin https://github.com/enzocerejo/cyber.git
  git config user.name "Enzo Cerejo"
  git config user.email "enzocerejo@users.noreply.github.com"
  git fetch origin main
  if not errorlevel 1 git reset --soft origin/main >nul
)

git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo [OK] Rien de nouveau a publier : GitHub est deja a jour.
  pause
  exit /b
)

git commit -m "Mise a jour du site" >nul
echo Envoi vers GitHub (la premiere fois, une fenetre de connexion GitHub peut s'ouvrir^)...
git push -u origin main
if errorlevel 1 (
  echo [X] L'envoi a echoue : lis le message au-dessus.
  pause
  exit /b
)

echo.
echo [OK] Site publie ! Il sera a jour dans 1 a 2 minutes sur :
echo      https://enzocerejo.github.io/cyber/
start https://enzocerejo.github.io/cyber/
pause
