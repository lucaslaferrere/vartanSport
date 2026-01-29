package controllers

import (
	"net/http"
	"os"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Login - Autenticación de usuarios
func Login(c *gin.Context) {
	var loginReq models.LoginRequest

	// Validar que el JSON sea correcto
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Buscar usuario por email
	var usuario models.Usuario
	if err := config.DB.Where("email = ?", loginReq.Email).First(&usuario).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	// Verificar que el usuario esté activo
	if !usuario.Activo {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario inactivo"})
		return
	}

	// Comparar password
	if err := bcrypt.CompareHashAndPassword([]byte(usuario.PasswordHash), []byte(loginReq.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	// Generar JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": usuario.ID,
		"email":   usuario.Email,
		"rol":     usuario.Rol,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Expira en 24 horas
	})

	// Firmar el token
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar token"})
		return
	}

	// Responder con el token y datos del usuario
	c.JSON(http.StatusOK, models.LoginResponse{
		Token:   tokenString,
		Usuario: usuario,
	})
}

// Register - Registro de nuevos usuarios (solo para testing, en producción lo haría solo el dueño)
func Register(c *gin.Context) {
	var regReq models.RegistroRequest

	if err := c.ShouldBindJSON(&regReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Validar que el rol sea válido
	if regReq.Rol != "dueño" && regReq.Rol != "empleado" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rol inválido"})
		return
	}

	// Verificar que el email no exista
	var existe models.Usuario
	if err := config.DB.Where("email = ?", regReq.Email).First(&existe).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El email ya está registrado"})
		return
	}

	// Hashear el password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(regReq.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar password"})
		return
	}

	// Crear el usuario
	usuario := models.Usuario{
		Nombre:       regReq.Nombre,
		Email:        regReq.Email,
		PasswordHash: string(hashedPassword),
		Rol:          regReq.Rol,
		Activo:       true,
	}

	if err := config.DB.Create(&usuario).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear usuario"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Usuario creado exitosamente",
		"usuario": usuario,
	})
}

// GetProfile - Obtener perfil del usuario autenticado
func GetProfile(c *gin.Context) {
	// El middleware ya validó el token y guardó el user_id en el context
	userID := c.GetInt("user_id")

	var usuario models.Usuario
	if err := config.DB.First(&usuario, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	c.JSON(http.StatusOK, usuario)
}
