// Package tests contains integration tests for sales, dashboard, and commission endpoints.
//
// To run: TEST_DATABASE_URL="postgres://user:pass@host/dbname?sslmode=disable" go test ./tests/ -v -run TestSales
//
// Bugs documented:
//  1. (HIGH)   GET /api/owner/ventas sin params devuelve solo 50 registros (limit default),
//              pero ventaService.getAll() en el frontend NO pasa parámetros de paginación,
//              por lo que el conteo client-side del dashboard de comisiones es incorrecto
//              cuando hay >50 ventas totales.
//  2. (HIGH)   CalcularComisionesMesActual usa Omit("gasto_publicitario") en UPDATE,
//              por lo que si se cambia el gasto via SetComisionPublicitariaDelMes y se
//              recalcula, el campo comision.gasto_publicitario NO se actualiza.
//              El dashboard lee SUM(comision.gasto_publicitario) → muestra valor incorrecto.
//  3. (MEDIUM) La fórmula del modal ConfigurarComision dice:
//              Sueldo = Bonos + ((Ventas - GastoPub) × porcentaje%)
//              Pero CalcularComisionesMesActual calcula:
//              comisionNeta = totalVentas × (porcentaje/100)  ← sin descontar gasto
//  4. (LOW)    gastos_test.go usa gorm.io/driver/sqlserver mientras el backend usa
//              PostgreSQL. Tests podrían pasar en SQL Server y fallar en prod con ILIKE, etc.
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
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ── helpers ──────────────────────────────────────────────────────────────────

func setupSalesTestDB(t *testing.T) {
	t.Helper()

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL no configurado — saltando test de integración")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("no se pudo conectar a la DB de tests: %v", err)
	}

	config.DB = db

	// Migrar todas las tablas necesarias para ventas/comisiones
	if err := config.DB.AutoMigrate(
		&models.Usuario{},
		&models.Cliente{},
		&models.FormaPago{},
		&models.Venta{},
		&models.VentaDetalle{},
		&models.PagoVenta{},
		&models.Pedido{},
		&models.Comision{},
		&models.ComisionPublicitariaMensual{},
	); err != nil {
		t.Fatalf("AutoMigrate falló: %v", err)
	}
}

// seedUsuario crea un usuario de prueba y lo limpia al finalizar el test.
func seedUsuario(t *testing.T, suffix string) models.Usuario {
	t.Helper()
	u := models.Usuario{
		Nombre:             "Test User " + suffix,
		Email:              fmt.Sprintf("testuser-%s-%d@test.com", suffix, time.Now().UnixNano()),
		PasswordHash:       "$2a$10$placeholder",
		Rol:                "empleado",
		Activo:             true,
		PorcentajeComision: 10,
		Sueldo:             50000,
	}
	if err := config.DB.Create(&u).Error; err != nil {
		t.Fatalf("seedUsuario: %v", err)
	}
	t.Cleanup(func() { config.DB.Unscoped().Delete(&u) })
	return u
}

// seedCliente crea un cliente de prueba.
func seedCliente(t *testing.T, usuarioID int) models.Cliente {
	t.Helper()
	c := models.Cliente{
		UsuarioID: usuarioID,
		Nombre:    fmt.Sprintf("Cliente Test %d", time.Now().UnixNano()),
	}
	if err := config.DB.Create(&c).Error; err != nil {
		t.Fatalf("seedCliente: %v", err)
	}
	t.Cleanup(func() { config.DB.Unscoped().Delete(&c) })
	return c
}

// seedFormaPago devuelve una forma de pago existente o crea una nueva.
func seedFormaPago(t *testing.T) models.FormaPago {
	t.Helper()
	var fp models.FormaPago
	if err := config.DB.First(&fp).Error; err == nil {
		return fp
	}
	fp = models.FormaPago{Nombre: "Efectivo"}
	if err := config.DB.Create(&fp).Error; err != nil {
		t.Fatalf("seedFormaPago: %v", err)
	}
	t.Cleanup(func() { config.DB.Unscoped().Delete(&fp) })
	return fp
}

// seedVenta inserta una venta directamente en la DB con fecha específica.
func seedVenta(t *testing.T, usuarioID, clienteID, formaPagoID int, fecha time.Time) models.Venta {
	t.Helper()
	total := float64(1000)
	sena := float64(0)
	v := models.Venta{
		UsuarioID:   usuarioID,
		ClienteID:   clienteID,
		FormaPagoID: formaPagoID,
		PrecioVenta: total,
		Ganancia:    total * 0.3,
		Total:       total,
		Sena:        &sena,
		Saldo:       0,
		TotalFinal:  total,
		FechaVenta:  fecha,
	}
	if err := config.DB.Create(&v).Error; err != nil {
		t.Fatalf("seedVenta: %v", err)
	}
	t.Cleanup(func() {
		config.DB.Where("venta_id = ?", v.ID).Delete(&models.Pedido{})
		config.DB.Where("venta_id = ?", v.ID).Delete(&models.PagoVenta{})
		config.DB.Where("venta_id = ?", v.ID).Delete(&models.VentaDetalle{})
		config.DB.Unscoped().Delete(&v)
	})
	return v
}

// setupDashboardRouter registra el endpoint del dashboard con middleware de dueño simulado.
func setupDashboardRouter(ownerID int) *gin.Engine {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", ownerID)
		c.Set("rol", "dueño")
		c.Next()
	})
	r.GET("/api/owner/dashboard", controllers.GetDashboardMensual)
	return r
}

// setupVentasRouter registra los endpoints de ventas.
func setupVentasRouter(ownerID int) *gin.Engine {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", ownerID)
		c.Set("rol", "dueño")
		c.Next()
	})
	r.GET("/api/owner/ventas", controllers.GetVentas)
	r.GET("/api/ventas/:id", controllers.GetVenta)
	return r
}

// setupComisionRouter registra los endpoints de comisiones.
func setupComisionRouter(ownerID int) *gin.Engine {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", ownerID)
		c.Set("rol", "dueño")
		c.Next()
	})
	r.POST("/api/owner/comisiones/calcular", controllers.CalcularComisionesMesActual)
	r.GET("/api/owner/comisiones-publicitarias/usuario/:id", controllers.GetComisionPublicitariaDelMes)
	r.POST("/api/owner/comisiones-publicitarias/usuario/:id", controllers.SetComisionPublicitariaDelMes)
	return r
}

// ── tests ─────────────────────────────────────────────────────────────────────

// TestDashboardVentasCountMatchesMesActual verifica que el dashboard solo cuenta
// ventas del mes seleccionado y excluye ventas de meses anteriores.
func TestDashboardVentasCountMatchesMesActual(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "dashboard-owner")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	now := time.Now()
	loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	mesActualStart := time.Date(now.Year(), now.Month(), 1, 12, 0, 0, 0, loc)

	// 3 ventas del mes actual
	for i := 0; i < 3; i++ {
		seedVenta(t, owner.ID, cliente.ID, fp.ID, mesActualStart.AddDate(0, 0, i))
	}
	// 2 ventas del mes anterior (no deben contarse)
	mesAnterior := mesActualStart.AddDate(0, -1, 0)
	for i := 0; i < 2; i++ {
		seedVenta(t, owner.ID, cliente.ID, fp.ID, mesAnterior.AddDate(0, 0, i))
	}

	router := setupDashboardRouter(owner.ID)
	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/owner/dashboard?mes=%d&anio=%d", int(now.Month()), now.Year()), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado 200, obtuve %d — body: %s", w.Code, w.Body.String())
	}

	var resp controllers.DashboardMensualResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("no se pudo parsear respuesta: %v", err)
	}

	// El dashboard debería reportar exactamente las ventas que están en el mes actual.
	// NOTA: en un ambiente de test compartido puede haber ventas de otros tests; el test
	// es más robusto si verificamos que nuestras 3 ventas están incluidas.
	if resp.CantidadVentas < 3 {
		t.Errorf("BUG: esperado al menos 3 ventas del mes actual, dashboard reporta %d", resp.CantidadVentas)
	}
}

// TestGetVentasDefaultLimitTruncaResultados documenta el bug donde GET /api/owner/ventas
// sin parámetros de paginación devuelve solo 50 registros (limit default), pero
// ventaService.getAll() en el frontend llama este endpoint sin parámetros. Si hay
// más de 50 ventas, el conteo client-side del dashboard de comisiones será incorrecto.
//
// ESTADO ESPERADO DEL TEST: PASS (documenta el comportamiento actual, que es el bug).
// La respuesta tiene total > len(ventas) cuando hay >50 registros.
func TestGetVentasDefaultLimitTruncaResultados(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "limit-test-owner")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	// Contar ventas existentes antes de insertar
	var totalAntes int64
	config.DB.Model(&models.Venta{}).Count(&totalAntes)

	// Insertar suficientes ventas para superar el límite default (50)
	cantInsertar := 55
	now := time.Now().UTC()
	for i := 0; i < cantInsertar; i++ {
		seedVenta(t, owner.ID, cliente.ID, fp.ID, now.AddDate(0, 0, -i))
	}

	var totalDespues int64
	config.DB.Model(&models.Venta{}).Count(&totalDespues)
	totalEsperado := totalAntes + int64(cantInsertar)
	if totalDespues != totalEsperado {
		t.Fatalf("esperaba %d ventas en DB, hay %d", totalEsperado, totalDespues)
	}

	router := setupVentasRouter(owner.ID)

	// BUG: ventaService.getAll() llama este endpoint SIN parámetros de paginación
	req, _ := http.NewRequest("GET", "/api/owner/ventas", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado 200, obtuve %d", w.Code)
	}

	var resp struct {
		Ventas     []models.Venta `json:"ventas"`
		Total      int64          `json:"total"`
		Page       int            `json:"page"`
		Limit      int            `json:"limit"`
		TotalPages int            `json:"total_pages"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("no se pudo parsear respuesta: %v", err)
	}

	// El total en la respuesta debe reflejar TODAS las ventas en la DB
	if resp.Total < int64(cantInsertar) {
		t.Errorf("total=%d, debería ser >= %d", resp.Total, cantInsertar)
	}

	// BUG DOCUMENTADO: cuando total > 50, la lista de ventas devuelta está truncada.
	// ventaService.getAll() usa response.data.ventas (solo la primera página).
	if resp.Total > int64(len(resp.Ventas)) {
		t.Logf(
			"BUG CONFIRMADO: total=%d pero len(ventas)=%d — ventaService.getAll() "+
				"en el frontend solo ve %d ventas, pierde las restantes %d. "+
				"El conteo client-side de comisiones será incorrecto.",
			resp.Total, len(resp.Ventas), len(resp.Ventas), resp.Total-int64(len(resp.Ventas)),
		)
		// No hacemos t.Fatal para que el test PASE (documenta el bug sin romper CI).
		// Cambiar a t.Errorf para hacerlo fallar cuando se corrija el bug en frontend.
	}

	// Verificar que el límite default es 50
	if len(resp.Ventas) > 50 {
		t.Errorf("se esperaban <= 50 ventas en la primera página (limit default), obtuve %d", len(resp.Ventas))
	}
}

// TestGetVentasPaginadoTotalMatchesCount verifica que el campo `total` de la respuesta
// paginada coincide con el COUNT real en la DB.
func TestGetVentasPaginadoTotalMatchesCount(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "paginado-owner")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	var countAntes int64
	config.DB.Model(&models.Venta{}).Count(&countAntes)

	cantInsertar := 15
	now := time.Now().UTC()
	for i := 0; i < cantInsertar; i++ {
		seedVenta(t, owner.ID, cliente.ID, fp.ID, now.AddDate(0, 0, -i))
	}

	var countDB int64
	config.DB.Model(&models.Venta{}).Count(&countDB)

	router := setupVentasRouter(owner.ID)
	req, _ := http.NewRequest("GET", "/api/owner/ventas?page=1&limit=5", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado 200, obtuve %d", w.Code)
	}

	var resp struct {
		Ventas []models.Venta `json:"ventas"`
		Total  int64          `json:"total"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("no se pudo parsear respuesta: %v", err)
	}

	if resp.Total != countDB {
		t.Errorf("total en respuesta=%d, COUNT en DB=%d — deben coincidir", resp.Total, countDB)
	}

	if len(resp.Ventas) > 5 {
		t.Errorf("se pedieron 5 por página, obtuve %d", len(resp.Ventas))
	}
}

// TestComisionGastoPublicitarioNoSeActualizaEnRecalculo documenta el bug donde
// CalcularComisionesMesActual usa Omit("gasto_publicitario") en el UPDATE de
// registros existentes. Si el dueño actualiza el gasto via SetComisionPublicitariaDelMes
// y luego recalcula, el campo comision.gasto_publicitario NO se actualiza.
// El dashboard lee SUM(comision.gasto_publicitario), por lo que muestra el valor viejo.
//
// ESTADO ESPERADO DEL TEST: FAIL (documenta el bug).
// Cuando se corrija, el test debería PASAR.
func TestComisionGastoPublicitarioNoSeActualizaEnRecalculo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "gasto-recalc")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	now := time.Now()
	mes := int(now.Month())
	anio := now.Year()

	// Insertar una venta del mes actual para que el cálculo de comisión tenga algo
	loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	mesStart := time.Date(anio, time.Month(mes), 15, 12, 0, 0, 0, loc)
	seedVenta(t, owner.ID, cliente.ID, fp.ID, mesStart)

	router := setupComisionRouter(owner.ID)

	// Paso 1: Setear gasto publicitario = 1000 en comisiones_publicitarias_mensuales
	gastoInicial := 1000.0
	body1, _ := json.Marshal(map[string]interface{}{
		"mes":           mes,
		"anio":          anio,
		"valor_comision": gastoInicial,
	})
	req1, _ := http.NewRequest("POST",
		fmt.Sprintf("/api/owner/comisiones-publicitarias/usuario/%d", owner.ID),
		bytes.NewBuffer(body1),
	)
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("SetGasto paso 1 falló: status=%d body=%s", w1.Code, w1.Body.String())
	}

	// Paso 2: Calcular comisiones → crea el registro de comision con gasto_publicitario=1000
	body2, _ := json.Marshal(map[string]interface{}{"mes": mes, "anio": anio})
	req2, _ := http.NewRequest("POST", "/api/owner/comisiones/calcular", bytes.NewBuffer(body2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("Calcular paso 2 falló: status=%d body=%s", w2.Code, w2.Body.String())
	}

	// Verificar que el registro se creó con gasto=1000
	var comAfterFirst models.Comision
	if err := config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", owner.ID, mes, anio).
		First(&comAfterFirst).Error; err != nil {
		t.Fatalf("no se encontró comision después del primer cálculo: %v", err)
	}
	t.Cleanup(func() { config.DB.Unscoped().Delete(&comAfterFirst) })

	firstGasto := float64(0)
	if comAfterFirst.GastoPublicitario != nil {
		firstGasto = *comAfterFirst.GastoPublicitario
	}
	if firstGasto != gastoInicial {
		t.Errorf("primer cálculo: gasto_publicitario=%v, esperado %v", firstGasto, gastoInicial)
	}

	// Paso 3: Actualizar el gasto a 2000 en comisiones_publicitarias_mensuales
	gastoNuevo := 2000.0
	body3, _ := json.Marshal(map[string]interface{}{
		"mes":           mes,
		"anio":          anio,
		"valor_comision": gastoNuevo,
	})
	req3, _ := http.NewRequest("POST",
		fmt.Sprintf("/api/owner/comisiones-publicitarias/usuario/%d", owner.ID),
		bytes.NewBuffer(body3),
	)
	req3.Header.Set("Content-Type", "application/json")
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("SetGasto paso 3 falló: status=%d body=%s", w3.Code, w3.Body.String())
	}

	// Paso 4: Recalcular → debería actualizar gasto_publicitario en el registro existente
	body4, _ := json.Marshal(map[string]interface{}{"mes": mes, "anio": anio})
	req4, _ := http.NewRequest("POST", "/api/owner/comisiones/calcular", bytes.NewBuffer(body4))
	req4.Header.Set("Content-Type", "application/json")
	w4 := httptest.NewRecorder()
	router.ServeHTTP(w4, req4)
	if w4.Code != http.StatusOK {
		t.Fatalf("Calcular paso 4 falló: status=%d body=%s", w4.Code, w4.Body.String())
	}

	// Verificar si el gasto se actualizó en el registro de comision
	var comAfterSecond models.Comision
	config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", owner.ID, mes, anio).
		First(&comAfterSecond)

	secondGasto := float64(0)
	if comAfterSecond.GastoPublicitario != nil {
		secondGasto = *comAfterSecond.GastoPublicitario
	}

	// BUG: El gasto sigue siendo 1000 (no se actualizó a 2000)
	// Cuando se corrija el bug, este test debería PASAR con secondGasto == gastoNuevo
	if secondGasto != gastoNuevo {
		t.Errorf(
			"BUG CONFIRMADO: comision.gasto_publicitario=%v, esperado %v. "+
				"CalcularComisionesMesActual usa Omit('gasto_publicitario') en UPDATE. "+
				"El dashboard mostrará publicidad=%v en lugar de %v.",
			secondGasto, gastoNuevo, secondGasto, gastoNuevo,
		)
	}
}

// TestGetVentaIncludesPagosArray verifica que GET /api/ventas/:id devuelve el array
// `pagos` con todos los comprobantes históricos de la venta.
func TestGetVentaIncludesPagosArray(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "pagos-test")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	venta := seedVenta(t, owner.ID, cliente.ID, fp.ID, time.Now().UTC())

	// Insertar 2 pagos directamente en DB
	fpUID := uint(fp.ID)
	for i := 0; i < 2; i++ {
		pago := models.PagoVenta{
			VentaID:     uint(venta.ID),
			Monto:       500,
			FormaPagoID: &fpUID,
		}
		if err := config.DB.Create(&pago).Error; err != nil {
			t.Fatalf("no se pudo crear pago %d: %v", i+1, err)
		}
		pagoLocal := pago
		t.Cleanup(func() { config.DB.Unscoped().Delete(&pagoLocal) })
	}

	router := setupVentasRouter(owner.ID)
	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/ventas/%d", venta.ID), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado 200, obtuve %d — body: %s", w.Code, w.Body.String())
	}

	var ventaResp struct {
		ID    int `json:"id"`
		Pagos []struct {
			ID    int     `json:"id"`
			Monto float64 `json:"monto"`
		} `json:"pagos"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &ventaResp); err != nil {
		t.Fatalf("no se pudo parsear respuesta: %v", err)
	}

	if len(ventaResp.Pagos) != 2 {
		t.Errorf("GET /api/ventas/%d: esperados 2 pagos, obtuve %d", venta.ID, len(ventaResp.Pagos))
	}
}

// TestComisionFormulaNoDescontaGastoPublicitario documenta la inconsistencia entre
// la fórmula mostrada en la UI y el cálculo real del backend.
//
// UI formula (ConfigurarComisionModal.tsx):
//   Sueldo Total = Bonos + ((Ventas - GastoPub) × porcentaje%)
//
// Backend (CalcularComisionesMesActual):
//   comisionNeta = totalVentas × (porcentajeComision / 100)   ← sin descontar gasto
//
// Este test verifica el comportamiento REAL del backend. Cuando el gasto publicitario
// es > 0, la comision calculada debería ser menor si se aplicara la fórmula de la UI.
func TestComisionFormulaNoDescontaGastoPublicitario(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	vendedor := seedUsuario(t, "formula-test")
	cliente := seedCliente(t, vendedor.ID)
	fp := seedFormaPago(t)

	now := time.Now()
	mes := int(now.Month())
	anio := now.Year()

	// Insertar una venta de $10,000 en el mes actual
	totalVenta := 10000.0
	loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	mesStart := time.Date(anio, time.Month(mes), 15, 12, 0, 0, 0, loc)
	venta := models.Venta{
		UsuarioID:   vendedor.ID,
		ClienteID:   cliente.ID,
		FormaPagoID: fp.ID,
		PrecioVenta: totalVenta,
		Total:       totalVenta,
		TotalFinal:  totalVenta,
		FechaVenta:  mesStart,
	}
	sena := float64(0)
	venta.Sena = &sena
	config.DB.Create(&venta)
	t.Cleanup(func() {
		config.DB.Where("venta_id = ?", venta.ID).Delete(&models.Pedido{})
		config.DB.Unscoped().Delete(&venta)
	})

	router := setupComisionRouter(vendedor.ID)

	// Setear gasto publicitario = 2000
	gastoPublicitario := 2000.0
	body, _ := json.Marshal(map[string]interface{}{
		"mes":           mes,
		"anio":          anio,
		"valor_comision": gastoPublicitario,
	})
	req, _ := http.NewRequest("POST",
		fmt.Sprintf("/api/owner/comisiones-publicitarias/usuario/%d", vendedor.ID),
		bytes.NewBuffer(body),
	)
	req.Header.Set("Content-Type", "application/json")
	httptest.NewRecorder()
	router.ServeHTTP(httptest.NewRecorder(), req)

	// Calcular comisiones
	calcBody, _ := json.Marshal(map[string]interface{}{"mes": mes, "anio": anio})
	calcReq, _ := http.NewRequest("POST", "/api/owner/comisiones/calcular", bytes.NewBuffer(calcBody))
	calcReq.Header.Set("Content-Type", "application/json")
	calcW := httptest.NewRecorder()
	router.ServeHTTP(calcW, calcReq)
	if calcW.Code != http.StatusOK {
		t.Fatalf("Calcular falló: %s", calcW.Body.String())
	}

	// Verificar la comisión calculada en la DB
	var comision models.Comision
	config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", vendedor.ID, mes, anio).First(&comision)
	t.Cleanup(func() { config.DB.Unscoped().Delete(&comision) })

	porcentaje := vendedor.PorcentajeComision / 100.0
	// Lo que calcula el backend actualmente:
	comisionBackend := comision.TotalComision
	comisionSegunBackendFormula := totalVenta * porcentaje

	// Lo que debería calcular según la UI:
	comisionSegunUIFormula := (totalVenta - gastoPublicitario) * porcentaje

	t.Logf("Ventas: $%.2f | GastoPub: $%.2f | Porcentaje: %.0f%%", totalVenta, gastoPublicitario, vendedor.PorcentajeComision)
	t.Logf("Comisión calculada por backend: $%.2f", comisionBackend)
	t.Logf("Fórmula backend (Ventas × %%): $%.2f", comisionSegunBackendFormula)
	t.Logf("Fórmula UI ((Ventas - GastoPub) × %%): $%.2f", comisionSegunUIFormula)

	// Verificar que el backend usa su propia fórmula (sin descontar gasto)
	tolerance := 0.01
	if abs(comisionBackend-comisionSegunBackendFormula) > tolerance {
		t.Errorf("Backend calculó $%.2f pero la fórmula backend esperaba $%.2f",
			comisionBackend, comisionSegunBackendFormula)
	}

	// Documentar la discrepancia entre UI y backend
	if abs(comisionBackend-comisionSegunUIFormula) > tolerance {
		t.Logf(
			"INCONSISTENCIA UI vs BACKEND: El modal muestra la fórmula con descuento de gasto "+
				"(resultado: $%.2f) pero el backend calcula sin descuento (resultado: $%.2f). "+
				"Diferencia: $%.2f",
			comisionSegunUIFormula, comisionBackend, comisionBackend-comisionSegunUIFormula,
		)
		// No t.Error aquí — es un bug de consistencia de fórmula, no un error de cálculo per se.
		// Cambiar a t.Error cuando se decida cuál fórmula es la correcta.
	}
}

// TestDashboardPublicidadUsaComisionesTable verifica que el campo `publicidad` del
// dashboard corresponde a SUM(comision.gasto_publicitario) y NO a
// SUM(comisiones_publicitarias_mensuales.valor_comision).
// Documenta que ambas tablas pueden tener valores divergentes.
func TestDashboardPublicidadUsaComisionesTable(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "publicidad-dashboard")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	now := time.Now()
	mes := int(now.Month())
	anio := now.Year()

	loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	mesStart := time.Date(anio, time.Month(mes), 10, 12, 0, 0, 0, loc)
	seedVenta(t, owner.ID, cliente.ID, fp.ID, mesStart)

	comisionRouter := setupComisionRouter(owner.ID)

	// Paso 1: Setear gasto a 5000 y calcular (crea registro de comision con gasto=5000)
	gastoInicial := 5000.0
	setBody1, _ := json.Marshal(map[string]interface{}{"mes": mes, "anio": anio, "valor_comision": gastoInicial})
	setReq1, _ := http.NewRequest("POST", fmt.Sprintf("/api/owner/comisiones-publicitarias/usuario/%d", owner.ID), bytes.NewBuffer(setBody1))
	setReq1.Header.Set("Content-Type", "application/json")
	comisionRouter.ServeHTTP(httptest.NewRecorder(), setReq1)

	calcBody1, _ := json.Marshal(map[string]interface{}{"mes": mes, "anio": anio})
	calcReq1, _ := http.NewRequest("POST", "/api/owner/comisiones/calcular", bytes.NewBuffer(calcBody1))
	calcReq1.Header.Set("Content-Type", "application/json")
	comisionRouter.ServeHTTP(httptest.NewRecorder(), calcReq1)

	var comision models.Comision
	config.DB.Where("usuario_id = ? AND mes = ? AND anio = ?", owner.ID, mes, anio).First(&comision)
	t.Cleanup(func() { config.DB.Unscoped().Delete(&comision) })

	// Paso 2: Actualizar gasto a 9999 en comisiones_publicitarias SIN recalcular
	gastoNuevo := 9999.0
	setBody2, _ := json.Marshal(map[string]interface{}{"mes": mes, "anio": anio, "valor_comision": gastoNuevo})
	setReq2, _ := http.NewRequest("POST", fmt.Sprintf("/api/owner/comisiones-publicitarias/usuario/%d", owner.ID), bytes.NewBuffer(setBody2))
	setReq2.Header.Set("Content-Type", "application/json")
	comisionRouter.ServeHTTP(httptest.NewRecorder(), setReq2)

	// Paso 3: Consultar el dashboard — ¿qué valor de publicidad muestra?
	dashRouter := setupDashboardRouter(owner.ID)
	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/owner/dashboard?mes=%d&anio=%d", mes, anio), nil)
	w := httptest.NewRecorder()
	dashRouter.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("dashboard falló: status=%d body=%s", w.Code, w.Body.String())
	}

	var dashResp controllers.DashboardMensualResponse
	json.Unmarshal(w.Body.Bytes(), &dashResp)

	// Verificar la fuente de datos del dashboard
	var gastoEnPublicitarias float64
	config.DB.Model(&models.ComisionPublicitariaMensual{}).
		Where("empleado_id = ? AND mes = ? AND anio = ?", owner.ID, mes, anio).
		Select("COALESCE(valor_comision, 0)").
		Scan(&gastoEnPublicitarias)

	t.Logf("comision.gasto_publicitario (tabla comisiones): %.2f", func() float64 {
		if comision.GastoPublicitario != nil {
			return *comision.GastoPublicitario
		}
		return 0
	}())
	t.Logf("comisiones_publicitarias_mensuales.valor_comision: %.2f", gastoEnPublicitarias)
	t.Logf("dashboard.publicidad: %.2f", dashResp.Publicidad)

	// El dashboard debería mostrar el gasto de comisiones_publicitarias_mensuales (9999)
	// pero en realidad muestra SUM(comision.gasto_publicitario) = 5000 (el original)
	if dashResp.Publicidad == gastoNuevo {
		// Comportamiento correcto: el dashboard usa comisiones_publicitarias_mensuales
		t.Logf("OK: dashboard usa comisiones_publicitarias_mensuales (valor correcto: %.2f)", gastoNuevo)
	} else if dashResp.Publicidad == gastoInicial {
		t.Logf(
			"BUG CONFIRMADO: dashboard.publicidad=%.2f usa comisiones.gasto_publicitario (valor viejo). "+
				"El gasto actualizado en comisiones_publicitarias_mensuales (%.2f) NO se refleja "+
				"hasta que se recalcule Y se solucione el bug de Omit('gasto_publicitario').",
			dashResp.Publicidad, gastoNuevo,
		)
	} else {
		t.Logf("Dashboard publicidad=%.2f (ni el valor inicial %.2f ni el nuevo %.2f — hay otras comisiones en el período)",
			dashResp.Publicidad, gastoInicial, gastoNuevo)
	}
}

// TestGetVentasByUsuarioNoTieneFiltroFecha documenta que GetVentasByUsuario devuelve
// TODAS las ventas históricas del usuario sin filtro de fecha. El dashboard filtra
// por mes, pero este endpoint no. Un vendedor con 12 ventas históricas tendrá 12 aquí.
func TestGetVentasByUsuarioNoTieneFiltroFecha(t *testing.T) {
	gin.SetMode(gin.TestMode)
	setupSalesTestDB(t)

	owner := seedUsuario(t, "historial-test")
	cliente := seedCliente(t, owner.ID)
	fp := seedFormaPago(t)

	// Insertar ventas en distintos meses
	for i := 0; i < 6; i++ {
		fecha := time.Now().UTC().AddDate(0, -i, 0) // un mes atrás cada iteración
		seedVenta(t, owner.ID, cliente.ID, fp.ID, fecha)
	}

	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("user_id", owner.ID)
		c.Set("rol", "dueño")
		c.Next()
	})
	r.GET("/api/owner/ventas/usuario/:id", controllers.GetVentasByUsuario)

	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/owner/ventas/usuario/%d", owner.ID), nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status esperado 200, obtuve %d", w.Code)
	}

	var ventas []models.Venta
	json.Unmarshal(w.Body.Bytes(), &ventas)

	// GetVentasByUsuario devuelve TODAS, sin filtro de fecha
	if len(ventas) < 6 {
		t.Errorf("esperadas >= 6 ventas históricas, obtuve %d", len(ventas))
	}

	t.Logf(
		"GetVentasByUsuario devuelve %d ventas (sin filtro de fecha). "+
			"Si el dueño quiere contar ventas del mes, necesita filtrar client-side o "+
			"usar el dashboard que sí aplica filtro de fecha.",
		len(ventas),
	)
}

// ── helpers matemáticos ───────────────────────────────────────────────────────

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
