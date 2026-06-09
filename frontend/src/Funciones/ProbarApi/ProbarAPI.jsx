import React from 'react';

function ProbarAPI() {
    const testFetch = async () => {
        console.clear();
        console.log("📡 Probando conexión DIRECTA (estilo Postman) sin proxies...");

        const API_KEY = 'Key VX2PWAKS6HGOXGXRAVMUHWAEOU';
        // 1. La URL exacta de tu Postman
        const url = 'https://api.golfcourseapi.com/v1/courses';

        try {
            // 2. Configuramos los headers igual que en la imagen
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': API_KEY // Postman añade esto automáticamente al usar "API Key"
                }
            });

            console.log(`🚥 Estado HTTP: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ El servidor respondió con error:", errorText);
                return;
            }

            // Si llega aquí, es que no necesitas proxy
            const data = await response.json();
            console.log("✅ ¡BRUTAL! Funciona directo en React sin proxies:", data);

        } catch (error) {
            console.error("⛔ Error en el intento directo:", error.message);
            console.log("💡 Nota: Si el error dice 'Failed to fetch' o menciona 'CORS', significa que el servidor bloquea a los navegadores y ahí SÍ obligatoriamente tendremos que revivir el proxy.");
        }
    };
    return (
        <div style={{ padding: '20px', backgroundColor: '#1A211B', border: '1px solid #D4FF00', borderRadius: '10px', margin: '20px', textAlign: 'center', color: 'white' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>🛠️ Diagnóstico de API Aislado</h3>
            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '15px' }}>Abre la consola (F12), haz clic y mira los registros.</p>
            <button
                onClick={testFetch}
                style={{ padding: '10px 20px', backgroundColor: 'rgb(193, 233, 182)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#1A211B' }}
            >
                Testear Conexión ⚡
            </button>
        </div>
    );
}

export default ProbarAPI;