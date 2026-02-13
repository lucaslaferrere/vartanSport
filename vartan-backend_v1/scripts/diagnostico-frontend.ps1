# Script de diagnóstico del frontend

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTICO FRONTEND - VARTAN" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Instrucciones
Write-Host "INSTRUCCIONES:" -ForegroundColor Yellow
Write-Host "1. Abre tu navegador en la aplicacion frontend" -ForegroundColor White
Write-Host "2. Presiona F12 para abrir las DevTools" -ForegroundColor White
Write-Host "3. Ve a la pestana 'Console'" -ForegroundColor White
Write-Host "4. Copia y pega el siguiente codigo:" -ForegroundColor White
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green

$diagnosticScript = @'
console.clear();
console.log('='.repeat(50));
console.log('🔍 DIAGNOSTICO DE AUTENTICACION - VARTAN');
console.log('='.repeat(50));
console.log('');

// 1. Verificar localStorage
console.log('📦 1. VERIFICANDO LOCALSTORAGE:');
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

if (token) {
    console.log('✅ Token encontrado en localStorage');
    console.log('   Token (primeros 30 chars):', token.substring(0, 30) + '...');
} else {
    console.log('❌ NO hay token en localStorage');
}

if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('✅ Usuario encontrado en localStorage');
        console.log('   Nombre:', user.nombre);
        console.log('   Email:', user.email);
        console.log('   Rol:', user.rol);
        console.log('   ID:', user.id);
    } catch (e) {
        console.log('❌ Error parseando usuario:', e);
    }
} else {
    console.log('❌ NO hay usuario en localStorage');
}

console.log('');

// 2. Verificar cookies
console.log('🍪 2. VERIFICANDO COOKIES:');
const cookies = document.cookie.split(';').map(c => c.trim());
const authCookie = cookies.find(c => c.startsWith('auth-token='));

if (authCookie) {
    const cookieToken = authCookie.split('=')[1];
    console.log('✅ Cookie auth-token encontrada');
    console.log('   Cookie (primeros 30 chars):', cookieToken.substring(0, 30) + '...');

    // Verificar si el token de la cookie coincide con localStorage
    if (token && cookieToken === token) {
        console.log('✅ Token de cookie coincide con localStorage');
    } else if (token && cookieToken !== token) {
        console.log('⚠️  Token de cookie NO coincide con localStorage');
    }
} else {
    console.log('❌ NO hay cookie auth-token');
    console.log('   Cookies disponibles:', cookies);
}

console.log('');

// 3. Verificar estado de autenticación en Zustand
console.log('🏪 3. VERIFICANDO ZUSTAND STORE:');
try {
    // Intentar acceder al store (esto puede variar según la implementación)
    console.log('ℹ️  Para verificar el store, ejecuta en la consola:');
    console.log('   window.__zustand__ (si está configurado)');
} catch (e) {
    console.log('⚠️  No se puede acceder al store directamente');
}

console.log('');

// 4. Verificar ruta actual
console.log('🛣️  4. VERIFICANDO RUTA:');
console.log('   Ruta actual:', window.location.pathname);
console.log('   URL completa:', window.location.href);

console.log('');

// 5. Intentar hacer una petición al backend
console.log('🌐 5. PROBANDO CONEXION AL BACKEND:');
console.log('   Haciendo petición a /api/owner/pedidos...');

const headers = {};
if (token) {
    headers['Authorization'] = `Bearer ${token}`;
}

fetch('http://localhost:8080/api/owner/pedidos', {
    method: 'GET',
    headers: headers
})
.then(response => {
    console.log('   Status:', response.status, response.statusText);
    if (response.ok) {
        console.log('✅ Backend responde correctamente');
        return response.json();
    } else {
        console.log('❌ Backend devolvió error:', response.status);
        return response.json().then(err => {
            console.log('   Error:', err);
        });
    }
})
.then(data => {
    if (data) {
        console.log('   Datos recibidos:', data);
    }
})
.catch(error => {
    console.log('❌ Error de red:', error.message);
});

console.log('');

// 6. Diagnóstico final
console.log('='.repeat(50));
console.log('📋 RESUMEN:');
console.log('='.repeat(50));

let problemas = [];

if (!token) {
    problemas.push('NO hay token en localStorage');
}
if (!userStr) {
    problemas.push('NO hay usuario en localStorage');
}
if (!authCookie) {
    problemas.push('NO hay cookie auth-token');
}

if (problemas.length === 0) {
    console.log('✅ TODO PARECE ESTAR BIEN');
    console.log('');
    console.log('Si aun asi te redirige, el problema puede ser:');
    console.log('1. El token está expirado');
    console.log('2. El JWT_SECRET del backend cambió');
    console.log('3. Hay un problema en el middleware de Next.js');
} else {
    console.log('❌ PROBLEMAS ENCONTRADOS:');
    problemas.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p}`);
    });
    console.log('');
    console.log('💡 SOLUCIÓN:');
    console.log('   Ejecuta en la consola:');
    console.log('   localStorage.clear(); location.reload();');
    console.log('   Luego haz login nuevamente');
}

console.log('');
console.log('='.repeat(50));
'@

Write-Host $diagnosticScript -ForegroundColor Cyan

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "5. Presiona ENTER para ejecutar el codigo" -ForegroundColor White
Write-Host "6. Analiza los resultados" -ForegroundColor White
Write-Host ""
Write-Host "NOTA: Si ves que NO hay token o cookie, ejecuta:" -ForegroundColor Yellow
Write-Host "  localStorage.clear(); location.reload();" -ForegroundColor White
Write-Host "  Y luego haz login nuevamente" -ForegroundColor White
Write-Host ""
