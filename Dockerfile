# Use official Eclipse Temurin Java 23 image
FROM eclipse-temurin:23-jdk

# Install Maven
RUN apt-get update && \
    apt-get install -y maven && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the project
RUN mvn clean package -DskipTests

# Expose port (Render sets $PORT, app reads it via server.port)
EXPOSE 8080

# Run the Spring Boot app
CMD ["java", "-jar", "target/daywisefxratedashboard-1.0-SNAPSHOT.jar"]
