// Script para probar el endpoint de Mi Comisión con Santino
const baseURL = 'http://localhost:8080';

async function testMiComision() {
  console.log('🧪 Probando endpoint de Mi Comisión para Santino...\n');

  // 1. Login con Santino
  let token;
  try {
    console.log('1️⃣ Haciendo login con Santino...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'santinom@vartan.com',
        password: 'SANTINOM1234'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Error en login, status:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.error('Response:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    token = loginData.token;
    console.log('✅ Login exitoso');
    console.log('Usuario:', loginData.usuario);
    console.log('Token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return;
  }

  if (!token) {
    console.error('❌ No se obtuvo token');
    return;
  }

  // 2. Probar endpoint de mi-resumen-comision
  try {
    console.log('\n2️⃣ Probando GET /api/mi-resumen-comision...');
    console.log('Headers:', {
      'Authorization': `Bearer ${token.substring(0, 20)}...`
    });

    const response = await fetch(`${baseURL}/api/mi-resumen-comision`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Status:', response.status, response.statusText);

    if (response.status === 404) {
      console.error('❌ 404 - Endpoint no encontrado');
      console.error('El backend no tiene implementado /api/mi-resumen-comision');
      return;
    }

    if (response.status === 401) {
      console.error('❌ 401 - No autorizado');
      console.error('El token no es válido o el usuario no tiene permisos');
      return;
    }

    if (response.status === 500) {
      const errorText = await response.text();
      console.error('❌ 500 - Error del servidor');
      console.error('Response:', errorText);
      return;
    }

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Respuesta exitosa (200 OK)');
      console.log('\n📦 Datos recibidos:');
      console.log(JSON.stringify(data, null, 2));

      console.log('\n📋 Resumen:');
      console.log('- Usuario:', data.usuario?.nombre);
      console.log('- Email:', data.usuario?.email);
      console.log('- Rol:', data.usuario?.rol);
      console.log('- Comisión:', data.configuracion?.porcentaje_comision + '%');
      console.log('- Sueldo base:', `$${data.configuracion?.sueldo_base?.toLocaleString()}`);
      console.log('- Total a cobrar:', `$${data.mes_actual?.total_a_cobrar?.toLocaleString()}`);
      console.log('- Historial:', data.historial?.length, 'registros');
    } else {
      console.error('❌ Error inesperado, status:', response.status);
      const errorText = await response.text();
      console.error('Response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);

    if (error.message === 'Failed to fetch') {
      console.error('\n🔌 El backend no está disponible o CORS está bloqueando la petición');
      console.error('Soluciones:');
      console.error('1. Verifica que el backend esté corriendo: go run main.go');
      console.error('2. Verifica que CORS esté configurado correctamente');
    }
  }

  console.log('\n✅ Prueba completada');
}

testMiComision();

