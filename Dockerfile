# Use the official Apache Tomcat 9 image with Java 17 (perfectly matching your local setup)
FROM tomcat:9.0-jdk17-corretto

# Create the exact same directory structure you use locally
RUN mkdir -p /usr/local/tomcat/webapps/conference_chatbox/WEB-INF/classes

# Copy all your HTML, CSS, and JS files into the server
COPY WebContent/ /usr/local/tomcat/webapps/conference_chatbox/

# Copy all your compiled Java backend logic into the server
COPY build/classes/ /usr/local/tomcat/webapps/conference_chatbox/WEB-INF/classes/

# Expose port 8080 so the internet can access it
EXPOSE 8080

# Start the Tomcat server automatically when the cloud server boots up
CMD ["catalina.sh", "run"]
