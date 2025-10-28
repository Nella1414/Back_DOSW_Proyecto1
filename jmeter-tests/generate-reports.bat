@echo off
echo Generando reportes HTML desde archivos JTL existentes...
echo.

REM Generar reporte de autenticación
if exist "results\auth-results.jtl" (
    echo Generando reporte de autenticación...
    "C:\apache-jmeter-5.6.3\bin\jmeter.bat" -g results\auth-results.jtl -o results\reports\auth-report
    echo Reporte generado: results\reports\auth-report\index.html
    echo.
)

REM Generar reporte de estudiantes
if exist "results\students-results.jtl" (
    echo Generando reporte de estudiantes...
    "C:\apache-jmeter-5.6.3\bin\jmeter.bat" -g results\students-results.jtl -o results\reports\students-report
    echo Reporte generado: results\reports\students-report\index.html
    echo.
)

REM Generar reporte de períodos académicos
if exist "results\academic-periods-results.jtl" (
    echo Generando reporte de períodos académicos...
    "C:\apache-jmeter-5.6.3\bin\jmeter.bat" -g results\academic-periods-results.jtl -o results\reports\academic-periods-report
    echo Reporte generado: results\reports\academic-periods-report\index.html
    echo.
)

echo Todos los reportes HTML generados exitosamente!
echo Abre los archivos index.html en tu navegador para ver los gráficos.
pause