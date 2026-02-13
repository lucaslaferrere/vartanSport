// Script para probar el endpoint de crear gasto
const baseURL = 'http://localhost:8080';

async function testCrearGasto() {
  console.log('🧪 Probando creación de gasto...\n');

  // 1. Login
  let token;
  try {
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@vartan.com', password: 'demo1234' })
    });
    const loginData = await loginResponse.json();
    token = loginData.token;
    console.log('✅ Login exitoso, token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
    console.log('Usuario:', loginData.usuario);
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return;
  }

  if (!token) {
    console.error('❌ No se obtuvo token');
    return;
  }

  // 2. Crear gasto
  try {
    console.log('\n2️⃣ Creando gasto...');
    const gastoData = {
      descripcion: 'Prueba desde Node.js',
      monto: 1000.50,
      fecha: '2026-02-12',
      categoria: 'Otros',
      proveedor: 'Proveedor Test',
      metodo_pago: 'Efectivo',
      comprobante: 'TEST-001',
      notas: 'Nota de prueba'
    };

    console.log('📦 Datos a enviar:', JSON.stringify(gastoData, null, 2));

    const response = await fetch(`${baseURL}/api/gastos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(gastoData)
    });

    console.log('📊 Status:', response.status, response.statusText);

    if (response.status === 500) {
      const errorText = await response.text();
      console.error('❌ Error 500 - Response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Error JSON:', errorJson);
      } catch (e) {
        console.error('❌ Response no es JSON válido');
      }
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ Gasto creado exitosamente:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.json();
      console.error('❌ Error:', errorData);
    }
  } catch (error) {
    console.error('❌ Error creando gasto:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('\n✅ Prueba completada');
}

testCrearGasto();

