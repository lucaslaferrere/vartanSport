package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware - Verifica que el token JWT sea válido
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obtener el header Authorization
		authHeader := c.GetHeader("Authorization")

		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token no proporcionado"})
			c.Abort()
			return
		}

		// El formato debe ser: "Bearer TOKEN"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Verificar y parsear el token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Verificar que el método de firma sea el correcto
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o expirado"})
			c.Abort()
			return
		}

		// Extraer los claims (datos del token)
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Claims inválidos"})
			c.Abort()
			return
		}

		// Guardar los datos del usuario en el contexto para usarlos en los controllers
		c.Set("user_id", int(claims["user_id"].(float64)))
		c.Set("email", claims["email"].(string))
		c.Set("rol", claims["rol"].(string))

		// Continuar con la siguiente función (el controller)
		c.Next()
	}
}

// RequireDueño - Middleware que verifica que el usuario sea dueño
func RequireDueño() gin.HandlerFunc {
	return func(c *gin.Context) {
		rol := c.GetString("rol")

		if rol != "dueño" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acceso denegado. Solo dueños pueden realizar esta acción"})
			c.Abort()
			return
		}

		c.Next()
	}
}
