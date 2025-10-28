@echo off
echo ========================================
echo SIRHA Complete Load Testing Suite
echo ========================================
echo.

REM Limpiar resultados anteriores
if exist "results\*.jtl" del /q results\*.jtl
if exist "results\reports" rmdir /s /q results\reports
if not exist "results\reports" mkdir results\reports

echo Configuración de pruebas:
echo - URL Base: http://localhost:3000
echo - Directorio de resultados: results\
echo.

echo Iniciando suite completa de pruebas de carga...
echo.

REM Prueba 1: Autenticación
echo ----------------------------------------
echo [1/3] Ejecutando: Prueba de Autenticación
echo ----------------------------------------
"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t auth-test-simple.jmx -l results\auth-results.jtl -f

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de autenticación
) else (
    echo ÉXITO: Prueba de autenticación completada
)

echo.
timeout /t 5 /nobreak >nul

REM Prueba 2: Estudiantes
echo ----------------------------------------
echo [2/3] Ejecutando: Prueba de Estudiantes
echo ----------------------------------------
"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t students-load-test.jmx -l results\students-results.jtl -f

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de estudiantes
) else (
    echo ÉXITO: Prueba de estudiantes completada
)

echo.
timeout /t 5 /nobreak >nul

REM Prueba 3: Períodos Académicos
echo ----------------------------------------
echo [3/3] Ejecutando: Prueba de Períodos Académicos
echo ----------------------------------------
"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t academic-periods-load-test.jmx -l results\academic-periods-results.jtl -f

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Falló la prueba de períodos académicos
) else (
    echo ÉXITO: Prueba de períodos académicos completada
)

echo.
echo ========================================
echo Resumen Final
echo ========================================

echo Archivos de resultados generados:
dir /b results\*.jtl 2>nul

echo.
echo Para ver resultados detallados de cada prueba:
echo - Autenticación: type results\auth-results.jtl
echo - Estudiantes: type results\students-results.jtl  
echo - Períodos Académicos: type results\academic-periods-results.jtl
echo.

echo ========================================
echo Suite de pruebas completada
echo ========================================
pause