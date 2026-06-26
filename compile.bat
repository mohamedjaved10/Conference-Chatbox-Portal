@echo off
echo Compiling Conference Chatbox Java Files...

REM Auto-detecting Tomcat path based on your screenshot!
set TOMCAT_HOME=
if exist "C:\Users\moham\Documents\Apache Tomcat\apache-tomcat-9.0.118\lib" set TOMCAT_HOME=C:\Users\moham\Documents\Apache Tomcat\apache-tomcat-9.0.118
if exist "C:\Users\moham\OneDrive\Documents\Apache Tomcat\apache-tomcat-9.0.118\lib" set TOMCAT_HOME=C:\Users\moham\OneDrive\Documents\Apache Tomcat\apache-tomcat-9.0.118

if "%TOMCAT_HOME%"=="" (
    echo [ERROR] Auto-detection failed. Please manually copy the path by clicking the empty space in your File Explorer address bar!
    pause
    exit /b
)
echo Found Tomcat at: %TOMCAT_HOME%


REM Set the output directory for the compiled classes
set OUT_DIR=WebContent\WEB-INF\classes

REM Create the classes directory if it doesn't exist
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

REM Set the classpath to include all JARs in Tomcat's lib directory
set CLASSPATH="%TOMCAT_HOME%\lib\*"

REM Compile the Java files specifically for Java 17
echo Compiling for Java 17...
javac --release 17 -cp %CLASSPATH% -d "%OUT_DIR%" src\com\chatbox\util\*.java src\com\chatbox\websocket\*.java

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Compilation complete! 
    echo The .class files have been placed in %OUT_DIR%.
    echo You can now copy the WebContent folder to Tomcat's webapps directory.
) else (
    echo.
    echo [ERROR] Compilation failed. Please ensure the TOMCAT_HOME path is correct and JDK is installed.
)
pause
