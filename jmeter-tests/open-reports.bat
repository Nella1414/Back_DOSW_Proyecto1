@echo off
echo Abriendo reportes HTML en el navegador...
echo.

if exist "results\reports\auth-report\index.html" (
    echo Abriendo reporte de autenticación...
    start results\reports\auth-report\index.html
)

if exist "results\reports\students-report\index.html" (
    echo Abriendo reporte de estudiantes...
    start results\reports\students-report\index.html
)

if exist "results\reports\academic-periods-report\index.html" (
    echo Abriendo reporte de períodos académicos...
    start results\reports\academic-periods-report\index.html
)

echo Reportes abiertos en el navegador!
pause