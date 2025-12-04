FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy JAR files and Java source
COPY *.jar ./
COPY *.java ./

# Compile Java file
RUN javac -cp ".:json-20230227.jar:mysql-connector-j-9.5.0.jar" BudgetServiceMySQL.java

EXPOSE 5001

# Run the application
CMD ["java", "-cp", ".:json-20230227.jar:mysql-connector-j-9.5.0.jar", "BudgetServiceMySQL"]
