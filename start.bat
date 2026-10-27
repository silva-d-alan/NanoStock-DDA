@echo off
title NanoStock - Inicializador
echo Ligando o sistema NanoStock...
docker compose up -d --build
echo.
echo Sistema rodando!
echo Acesse no navegador: http://localhost:8080
timeout /t 5 /nobreak >nul
start http://localhost:8080