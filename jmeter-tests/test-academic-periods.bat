@echo off
echo Ejecutando prueba de períodos académicos...
"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t academic-periods-load-test.jmx -l results\academic-periods-results.jtl -f
echo.
echo Prueba completada
pause