@echo off
REM Script para ejecutar todas las pruebas de carga JMeter del sistema SIRHA
REM Autor: SIRHA Development Team
REM Fecha: 2024

echo ========================================
echo SIRHA Load Testing Suite
echo ========================================
echo.

REM Verificar si JMeter está instalado
where jmeter >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: JMeter no está instalado o no está en el PATH
    echo Por favor instale Apache JMeter y agregue el directorio bin al PATH
    pause
    exit /b 1
)

REM Crear directorio de resultados si no existe
if not exist "results" mkdir results
if not exist "results\reports" mkdir results\reports

REM Configuración por defecto
set BASE_URL=http://localhost:3000
set ADMIN_EMAIL=admin@example.com
set ADMIN_PASSWORD=AdminPassword123!

REM Permitir override de variables desde argumentos
if not "%1"=="" set BASE_URL=%1
if not "%2"=="" set ADMIN_EMAIL=%2
if not "%3"=="" set ADMIN_PASSWORD=%3

echo Configuración de pruebas:
echo - URL Base: %BASE_URL%
echo - Admin Email: %ADMIN_EMAIL%
echo - Directorio de resultados: results\
echo.

REM Función para ejecutar una prueba individual
:run_test
set test_name=%1
set jmx_file=%2
set threads=%3
set ramp_up=%4
set loops=%5

echo ----------------------------------------
echo Ejecutando: %test_name%
echo Archivo: %jmx_file%
echo Hilos: %threads%, Rampa: %ramp_up%s, Loops: %loops%
echo ----------------------------------------

jmeter -n -t %jmx_file% ^
    -l results\%test_name%-results.jtl ^
    -e -o results\reports\%test_name%-report ^
    -JBASE_URL=%BASE_URL% ^
    -JADMIN_EMAIL=%ADMIN_EMAIL% ^
    -JADMIN_PASSWORD=%ADMIN_PASSWORD% ^
    -JTEST_THREADS=%threads% ^
    -JRAMP_UP_PERIOD=%ramp_up% ^
    -JLOOP_COUNT=%loops%

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la ejecución de %test_name%
    echo Continuando con las siguientes pruebas...
    echo.
) else (
    echo ÉXITO: %test_name% completado
    echo Reporte disponible en: results\reports\%test_name%-report\index.html
    echo.
)

goto :eof

REM Ejecutar pruebas individuales
echo Iniciando pruebas de carga...
echo.

call :run_test "auth-load" "auth-load-test.jmx" 50 60 10
timeout /t 30 /nobreak >nul

call :run_test "students-load" "students-load-test.jmx" 30 60 5
timeout /t 30 /nobreak >nul

call :run_test "academic-periods-load" "academic-periods-load-test.jmx" 25 30 3
timeout /t 30 /nobreak >nul

REM Prueba integral del sistema
echo ----------------------------------------
echo Ejecutando prueba integral del sistema
echo ----------------------------------------

jmeter -n -t sirha-full-load-test.jmx ^
    -l results\full-system-results.jtl ^
    -e -o results\reports\full-system-report ^
    -JBASE_URL=%BASE_URL% ^
    -JADMIN_EMAIL=%ADMIN_EMAIL% ^
    -JADMIN_PASSWORD=%ADMIN_PASSWORD% ^
    -JSTUDENT_THREADS=40 ^
    -JADMIN_THREADS=10 ^
    -JRAMP_UP_PERIOD=120 ^
    -JTEST_DURATION=600

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba integral del sistema
) else (
    echo ÉXITO: Prueba integral completada
    echo Reporte disponible en: results\reports\full-system-report\index.html
)

echo.
echo ========================================
echo Resumen de ejecución
echo ========================================

REM Mostrar resumen de archivos generados
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
echo Archivos de datos sin procesar (.jtl) disponibles en results\
echo para análisis adicional con herramientas externas.
echo.

pause