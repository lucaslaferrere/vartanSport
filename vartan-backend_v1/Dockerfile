# Build stage
FROM golang:alpine AS builder
WORKDIR /app

# Instalar certificados CA para HTTPS
RUN apk add --no-cache ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app .

# Run stage
FROM alpine:latest
WORKDIR /app

# Copiar certificados CA
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/app .

EXPOSE 8080
CMD ["./app"]
