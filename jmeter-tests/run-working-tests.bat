@echo off
echo ========================================
echo SIRHA Load Testing Suite - Working Version
echo ========================================
echo.

REM Limpiar resultados anteriores
if exist "results\*.jtl" del /q results\*.jtl
if exist "results\reports" rmdir /s /q results\reports
if not exist "results\reports" mkdir results\reports

REM Configuración
set BASE_URL=http://localhost:3000
set ADMIN_EMAIL=admin@example.com
set ADMIN_PASSWORD=AdminPassword123!

echo Configuración de pruebas:
echo - URL Base: %BASE_URL%
echo - Admin Email: %ADMIN_EMAIL%
echo - Directorio de resultados: results\
echo.

echo Iniciando pruebas de carga...
echo.

REM Prueba de autenticación
echo ----------------------------------------
echo Ejecutando: Prueba de Autenticación
echo Archivo: auth-test-simple.jmx
echo Hilos: 5, Rampa: 10s, Loops: 3
echo ----------------------------------------

"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t auth-test-simple.jmx -l results\auth-results.jtl -f

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de autenticación
) else (
    echo ÉXITO: Prueba de autenticación completada
    echo Resultados guardados en: results\auth-results.jtl
)

echo.
echo ========================================
echo Resumen de ejecución
echo ========================================

echo Archivos de resultados generados:
dir /b results\*.jtl 2>nul

echo.
echo Para ver resultados detallados:
echo type results\auth-results.jtl
echo.

pause