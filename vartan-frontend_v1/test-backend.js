// Script de prueba para verificar la conectividad con el backend
const baseURL = 'http://localhost:8080';

async function testBackend() {
  console.log('🧪 Iniciando pruebas del backend...\n');

  // 1. Test de salud
  try {
    console.log('1️⃣ Probando /health...');
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
  } catch (error) {
    console.error('❌ Error en /health:', error.message);
    return;
  }

  // 2. Test de login
  let token;
  try {
    console.log('\n2️⃣ Probando login...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@vartan.com', password: 'demo1234' })
    });
    const loginData = await loginResponse.json();
    token = loginData.token;
    console.log('✅ Login exitoso, token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return;
  }

  if (!token) {
    console.error('❌ No se obtuvo token, no se pueden probar endpoints protegidos');
    return;
  }

  // 3. Test de /api/gastos
  try {
    console.log('\n3️⃣ Probando GET /api/gastos...');
    const gastosResponse = await fetch(`${baseURL}/api/gastos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const gastosData = await gastosResponse.json();
    console.log('✅ Gastos:', {
      status: gastosResponse.status,
      total: gastosData.total,
      cantidad: gastosData.gastos?.length
    });
  } catch (error) {
    console.error('❌ Error en /api/gastos:', error.message);
  }

  // 4. Test de /api/gastos/resumen
  try {
    console.log('\n4️⃣ Probando GET /api/gastos/resumen...');
    const resumenResponse = await fetch(`${baseURL}/api/gastos/resumen`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('   Status:', resumenResponse.status);

    if (resumenResponse.status === 500) {
      const errorText = await resumenResponse.text();
      console.error('❌ Error 500 - Response:', errorText);
    } else {
      const resumenData = await resumenResponse.json();
      console.log('✅ Resumen:', resumenData);
    }
  } catch (error) {
    console.error('❌ Error en /api/gastos/resumen:', error.message);
  }

  console.log('\n✅ Pruebas completadas');
}

testBackend();

