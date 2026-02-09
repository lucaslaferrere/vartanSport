# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilación
RUN apk add --no-cache ca-certificates git tzdata

# Copiar archivos de dependencias primero (mejor cache de Docker)
COPY go.mod go.sum ./
RUN go mod download

# Copiar todo el código
COPY . .

# Eliminar archivos con funciones main adicionales que causan conflicto
RUN rm -f create_owner.go register_employees.go verify_employees.go register_all_employees.go create_user.go

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o app .

# Run stage
FROM alpine:latest

WORKDIR /app

# Instalar certificados CA y zona horaria
RUN apk add --no-cache ca-certificates tzdata

# Configurar zona horaria de Argentina
ENV TZ=America/Argentina/Buenos_Aires

# Copiar certificados y binario
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /app/app .

# Crear directorio para uploads
RUN mkdir -p /app/uploads/comprobantes

# Usuario no-root para seguridad
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Puerto que escucha la aplicación
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Comando para iniciar la aplicación
CMD ["./app"]
