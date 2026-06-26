# Use the official Apache Tomcat 9 image with Java 17
FROM tomcat:9.0-jdk17-corretto

# Create the exact same directory structure you use locally
RUN mkdir -p /usr/local/tomcat/webapps/conference_chatbox

# Copy all your HTML, CSS, JS, and compiled Java class files into the server
# (Because your compile.bat puts the .class files inside WebContent/WEB-INF/classes, this single line copies everything!)
COPY WebContent/ /usr/local/tomcat/webapps/conference_chatbox/

# Expose port 8080 so the internet can access it
EXPOSE 8080

# Start the Tomcat server automatically when the cloud server boots up
CMD ["catalina.sh", "run"]
