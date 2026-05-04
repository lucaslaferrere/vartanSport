package controllers

import (
	"net/http"
	"os"
	"strings"
	"time"
	"vartan-backend/config"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func normalizeRegistroRol(raw string) string {
	rol := strings.TrimSpace(strings.ToLower(raw))
	rol = strings.NewReplacer(
		"á", "a",
		"é", "e",
		"í", "i",
		"ó", "o",
		"ú", "u",
		"ñ", "n",
		"Ã¡", "a",
		"Ã©", "e",
		"Ã­", "i",
		"Ã³", "o",
		"Ãº", "u",
		"Ã±", "n",
		"Ã£Â±", "n",
	).Replace(rol)

	switch rol {
	case "dueño", "dueno", "owner", "admin":
		return "dueño"
	case "empleado", "vendedor", "seller":
		return "empleado"
	case "repositor", "repositores":
		return "repositor"
	default:
		return rol
	}
}

// Login godoc
// @Summary Iniciar sesión
// @Description Autentica un usuario y devuelve un token JWT
// @Tags Autenticación
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Credenciales de login"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} map[string]string "Datos inválidos"
// @Failure 401 {object} map[string]string "Credenciales inválidas"
// @Router /auth/login [post]
func Login(c *gin.Context) {
	var loginReq models.LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	var usuario models.Usuario
	if err := config.DB.Where("email = ?", loginReq.Email).First(&usuario).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	if !usuario.Activo {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario inactivo"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(usuario.PasswordHash), []byte(loginReq.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": usuario.ID,
		"email":   usuario.Email,
		"rol":     usuario.Rol,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al generar token"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:   tokenString,
		Usuario: usuario,
	})
}

// Register godoc
// @Summary Registrar usuario
// @Description Crea un nuevo usuario en el sistema
// @Tags Autenticación
// @Accept json
// @Produce json
// @Param request body models.RegistroRequest true "Datos del nuevo usuario"
// @Success 201 {object} map[string]interface{} "Usuario creado exitosamente"
// @Failure 400 {object} map[string]string "Datos inválidos o email ya registrado"
// @Failure 500 {object} map[string]string "Error interno"
// @Router /auth/register [post]
func Register(c *gin.Context) {
	var regReq models.RegistroRequest

	if err := c.ShouldBindJSON(&regReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	rol := normalizeRegistroRol(regReq.Rol)
	if rol != "dueño" && rol != "empleado" && rol != "repositor" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rol inválido"})
		return
	}

	var existe models.Usuario
	if err := config.DB.Where("email = ?", regReq.Email).First(&existe).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El email ya está registrado"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(regReq.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al procesar password"})
		return
	}

	usuario := models.Usuario{
		Nombre:       regReq.Nombre,
		Email:        regReq.Email,
		PasswordHash: string(hashedPassword),
		Rol:          rol,
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

// GetProfile godoc
// @Summary Obtener perfil del usuario
// @Description Devuelve los datos del usuario autenticado
// @Tags Autenticación
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.Usuario
// @Failure 401 {object} map[string]string "No autorizado"
// @Failure 404 {object} map[string]string "Usuario no encontrado"
// @Router /api/profile [get]
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
