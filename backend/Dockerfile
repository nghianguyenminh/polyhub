# --- Stage 1: Build Stage ---
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Sao chép pom.xml và tải dependencies trước để tận dụng Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Sao chép mã nguồn và đóng gói ứng dụng (bỏ qua chạy tests để tăng tốc build)
COPY src ./src
RUN mvn clean package -DskipTests

# --- Stage 2: Runtime Stage ---
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Sao chép file WAR đã build từ Stage 1
COPY --from=build /app/target/*.war app.war

# Port mặc định của Spring Boot
EXPOSE 8080

# Chạy ứng dụng Spring Boot với các tham số tối ưu hóa cho môi trường RAM thấp (Free tier)
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.war"]
