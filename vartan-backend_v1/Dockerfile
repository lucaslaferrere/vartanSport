# Build stage
FROM golang:1.25-alpine AS builder
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Eliminar archivos con funciones main adicionales
RUN rm -f create_owner.go register_employees.go verify_employees.go
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app .

# Run stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/app .
EXPOSE 8080
CMD ["./app"]
