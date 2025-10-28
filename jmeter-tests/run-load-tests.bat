@echo off
REM Script corregido para ejecutar pruebas de carga JMeter del sistema SIRHA

echo ========================================
echo SIRHA Load Testing Suite
echo ========================================
echo.

REM Crear directorio de resultados si no existe
if not exist "results" mkdir results
if not exist "results\reports" mkdir results\reports

REM Configuración por defecto
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

REM Prueba 1: Autenticación
echo ----------------------------------------
echo Ejecutando: Prueba de Autenticación
echo Archivo: auth-load-test.jmx
echo Hilos: 50, Rampa: 60s, Loops: 10
echo ----------------------------------------

"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t auth-test-simple.jmx ^
    -l results\auth-load-results.jtl ^
    -f ^
    -JBASE_URL=%BASE_URL% ^
    -JADMIN_EMAIL=%ADMIN_EMAIL% ^
    -JADMIN_PASSWORD=%ADMIN_PASSWORD% ^
    -JTEST_THREADS=50 ^
    -JRAMP_UP_PERIOD=60 ^
    -JLOOP_COUNT=10

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de autenticación
) else (
    echo ÉXITO: Prueba de autenticación completada
    echo Reporte: results\reports\auth-load-report\index.html
)

echo.
timeout /t 10 /nobreak >nul

REM Prueba 2: Estudiantes
echo ----------------------------------------
echo Ejecutando: Prueba de Estudiantes
echo Archivo: students-load-test.jmx
echo Hilos: 30, Rampa: 60s, Loops: 5
echo ----------------------------------------

"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t students-load-test.jmx ^
    -l results\students-load-results.jtl ^
    -e -o results\reports\students-load-report ^
    -JBASE_URL=%BASE_URL% ^
    -JADMIN_EMAIL=%ADMIN_EMAIL% ^
    -JADMIN_PASSWORD=%ADMIN_PASSWORD% ^
    -JTEST_THREADS=30 ^
    -JRAMP_UP_PERIOD=60 ^
    -JLOOP_COUNT=5

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de estudiantes
) else (
    echo ÉXITO: Prueba de estudiantes completada
    echo Reporte: results\reports\students-load-report\index.html
)

echo.
timeout /t 10 /nobreak >nul

REM Prueba 3: Períodos Académicos
echo ----------------------------------------
echo Ejecutando: Prueba de Períodos Académicos
echo Archivo: academic-periods-load-test.jmx
echo Hilos: 25, Rampa: 30s, Loops: 3
echo ----------------------------------------

"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t academic-periods-load-test.jmx ^
    -l results\academic-periods-results.jtl ^
    -e -o results\reports\academic-periods-report ^
    -JBASE_URL=%BASE_URL% ^
    -JADMIN_EMAIL=%ADMIN_EMAIL% ^
    -JADMIN_PASSWORD=%ADMIN_PASSWORD% ^
    -JTEST_THREADS=25 ^
    -JRAMP_UP_PERIOD=30 ^
    -JLOOP_COUNT=3

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de períodos académicos
) else (
    echo ÉXITO: Prueba de períodos académicos completada
    echo Reporte: results\reports\academic-periods-report\index.html
)

echo.
echo ========================================
echo Resumen de ejecución
echo ========================================

echo Archivos de resultados generados:
dir /b results\*.jtl 2>nul

echo.
echo Reportes HTML generados:
dir /b results\reports\ 2>nul

echo.
echo ========================================
echo Pruebas de carga completadas
echo ========================================
echo.
echo Para ver los reportes detallados, abra los archivos index.html
echo en cada directorio de results\reports\
echo.

pause