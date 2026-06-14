// golfService.js
const API_KEY = 'Key VX2PWAKS6HGOXGXRAVMUHWAEOU';
export const obtenerCamposDeGolf = async () => {
    // REVISAR CACHÉ: Si ya los descargamos antes, los devolvemos al instante
    const cache = sessionStorage.getItem('golf_courses_cache');
    if (cache) {
        return JSON.parse(cache);
    }

    const url = 'https://api.golfcourseapi.com/v1/courses';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': API_KEY 
            }
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        const courses = data.courses || data;

        // Quitar datos repetidos y vacíos
        const nombresVistos = new Set();
        const camposUnicos = courses.filter(campo => {
            if (!campo.club_name || nombresVistos.has(campo.club_name)) {
                return false;
            }
            nombresVistos.add(campo.club_name);
            return true;
        });

        //  Quedarnos con los primeros 15 nombres
        const primeros15Campos = camposUnicos.slice(0, 15);

        // Solo si la lista tiene datos
        if (primeros15Campos.length > 0) {
            sessionStorage.setItem('golf_courses_cache', JSON.stringify(primeros15Campos));
        }

        return primeros15Campos;

    } catch (error) {
        console.error("Error real en la API:", error);
        return []; // Retorna vacío si falla y no hay caché
    }
};