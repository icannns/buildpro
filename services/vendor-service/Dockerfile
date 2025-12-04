FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o vendor-service main.go

# Runtime stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/vendor-service .

EXPOSE 5005

CMD ["./vendor-service"]
