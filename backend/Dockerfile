# Dùng image Java chính thức
FROM openjdk:17-jdk-slim

# Chỉ định thư mục làm việc
WORKDIR /app

# Copy toàn bộ project vào container
COPY . .

# Build project bằng Maven Wrapper
RUN ./mvnw clean package -DskipTests

# Chạy file JAR sau khi build
CMD ["java", "-jar", "target/*.jar"]
