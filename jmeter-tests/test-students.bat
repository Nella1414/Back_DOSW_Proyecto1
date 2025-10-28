@echo off
echo Ejecutando prueba de estudiantes...
"C:\apache-jmeter-5.6.3\bin\jmeter.bat" -n -t students-load-test.jmx -l results\students-results.jtl -f
echo.
echo Prueba completada
pause