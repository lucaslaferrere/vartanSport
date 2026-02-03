package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
	"vartan-backend/config"
	"vartan-backend/controllers"
	"vartan-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	t.Helper()

	dsn := testDatabaseDSN(t)
	db, err := gorm.Open(sqlserver.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("no se pudo conectar a la DB de tests: %v", err)
	}

	config.DB = db

	if err := config.DB.AutoMigrate(&models.Gasto{}); err != nil {
		t.Fatalf("no se pudo migrar la tabla gastos: %v", err)
	}
}

func testDatabaseDSN(t *testing.T) string {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL no configurado")
	}
	return dsn
}

func setupRouter() *gin.Engine {
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("cliente_id", uint(1))
		c.Set("usuario_id", uint(1))
		c.Next()
	})

	router.POST("/api/gastos", controllers.CrearGasto)
	router.GET("/api/gastos", controllers.ListarGastos)
	router.GET("/api/gastos/:id", controllers.ObtenerGasto)
	router.PUT("/api/gastos/:id", controllers.ActualizarGasto)
	router.DELETE("/api/gastos/:id", controllers.EliminarGasto)
	router.GET("/api/gastos/resumen", controllers.ObtenerResumenGastos)
	router.GET("/api/gastos/por-mes", controllers.ObtenerGastosPorMes)
	router.GET("/api/gastos/proveedores", controllers.ListarProveedores)

	return router
}

func seedGasto(t *testing.T) models.Gasto {
	t.Helper()

	gasto := models.Gasto{
		Descripcion: "Seed Gasto",
		Monto:       123.45,
		Fecha:       time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC),
		Categoria:   "Otros",
		Proveedor:   "Seed",
		MetodoPago:  "Efectivo",
		ClienteID:   1,
		UsuarioID:   1,
	}

	if err := config.DB.Create(&gasto).Error; err != nil {
		t.Fatalf("no se pudo crear gasto seed: %v", err)
	}

	return gasto
}

func TestCrearGasto(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	router := setupRouter()

	gasto := models.GastoInput{
		Descripcion: "Test Alquiler",
		Monto:       50000,
		Fecha:       "2026-02-01",
		Categoria:   "Alquiler",
		Proveedor:   "Test Inmobiliaria",
		MetodoPago:  "Transferencia",
	}

	body, _ := json.Marshal(gasto)
	req, _ := http.NewRequest("POST", "/api/gastos", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusCreated, w.Code)
	}
}

func TestCrearGastoSinMonto(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	router := setupRouter()

	gasto := models.GastoInput{
		Descripcion: "Test sin monto",
		Fecha:       "2026-02-01",
		Categoria:   "Otros",
	}

	body, _ := json.Marshal(gasto)
	req, _ := http.NewRequest("POST", "/api/gastos", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusBadRequest, w.Code)
	}
}

func TestCrearGastoConCategoriaInvalida(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	router := setupRouter()

	gasto := models.GastoInput{
		Descripcion: "Test",
		Monto:       1000,
		Fecha:       "2026-02-01",
		Categoria:   "CategoriaInvalida",
	}

	body, _ := json.Marshal(gasto)
	req, _ := http.NewRequest("POST", "/api/gastos", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusBadRequest, w.Code)
	}
}

func TestListarGastos(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seedGasto(t)
	router := setupRouter()

	req, _ := http.NewRequest("GET", "/api/gastos", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusOK, w.Code)
	}
}

func TestActualizarGasto(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	gasto := seedGasto(t)
	router := setupRouter()

	gastoActualizado := models.GastoInput{
		Descripcion: "Test Actualizado",
		Monto:       55000,
		Fecha:       "2026-02-02",
		Categoria:   "Alquiler",
	}

	body, _ := json.Marshal(gastoActualizado)
	req, _ := http.NewRequest("PUT", "/api/gastos/"+intToString(gasto.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusOK, w.Code)
	}
}

func TestEliminarGasto(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	gasto := seedGasto(t)
	router := setupRouter()

	req, _ := http.NewRequest("DELETE", "/api/gastos/"+intToString(gasto.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusOK, w.Code)
	}
}

func TestResumenGastos(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seedGasto(t)
	router := setupRouter()

	req, _ := http.NewRequest("GET", "/api/gastos/resumen?fecha_desde=2026-02-01&fecha_hasta=2026-02-28", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusOK, w.Code)
	}
}

func TestGastosPorMes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seedGasto(t)
	router := setupRouter()

	req, _ := http.NewRequest("GET", "/api/gastos/por-mes?anio=2026", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusOK, w.Code)
	}
}

func TestListarProveedores(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupTestDB(t)
	seedGasto(t)
	router := setupRouter()

	req, _ := http.NewRequest("GET", "/api/gastos/proveedores", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado %d, obtuve %d", http.StatusOK, w.Code)
	}
}

func intToString(v int) string {
	return fmt.Sprintf("%d", v)
}
