# ============================
# 🚀 Build Stage
# ============================
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app

# Copy file cấu hình Maven và source code
COPY pom.xml .
COPY src ./src

# Build ứng dụng, bỏ qua test
RUN mvn clean package -DskipTests

# ============================
# 🏃 Run Stage
# ============================
FROM openjdk:21-jdk-slim
WORKDIR /app

# Copy file JAR từ stage build sang stage run
COPY --from=build /app/target/*.jar app.jar

# Thiết lập biến môi trường cho MongoDB (Render sẽ tự thay giá trị)
ENV SPRING_DATA_MONGODB_URI=${SPRING_DATA_MONGODB_URI}
ENV SERVER_PORT=8080

EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java","-jar","app.jar"]
