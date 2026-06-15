<div align="center">

# ⛳ Golf Tracker

**Plataforma web para que el golfista amateur registre sus rondas, siga su progreso y descubra en qué mejorar.**

Proyecto Final de Grado · Desarrollo de Aplicaciones Web (DAW) · Joyfe

</div>

---

## 📖 Sobre el proyecto

Golf Tracker es una aplicación web pensada para el golfista aficionado. La idea surge de una necesidad real: muchos jugadores anotan sus tarjetas en papel y nunca llegan a entender cómo evoluciona su juego ni dónde pierden golpes. Esta plataforma digitaliza ese proceso y va un paso más allá, convirtiendo los datos de cada ronda en estadísticas útiles y comprensibles.

El usuario registra su partida hoyo a hoyo, y la aplicación calcula automáticamente sus resultados, lleva el seguimiento de su handicap y le muestra su progreso a lo largo del tiempo mediante gráficas. El objetivo es que cualquier golfista, sin conocimientos técnicos, pueda sacar conclusiones sobre su juego.

Más allá del producto en sí, este proyecto se ha abordado como una oportunidad para construir algo **a nivel profesional**: no solo "que funcione", sino que esté bien arquitecturado, contenerizado, con despliegue automatizado y pensado para poder crecer en el futuro. Por eso el repositorio refleja tanto el desarrollo de la aplicación como toda la capa de infraestructura y DevOps que la sostiene.

---

## ✨ Qué hace la aplicación

- **Gestión de cuentas.** Registro e inicio de sesión seguros, con contraseñas cifradas y sesiones gestionadas mediante tokens.
- **Registro de rondas.** El jugador introduce su partida hoyo a hoyo: golpes, putts y si acertó la calle.
- **Cálculo automático.** La aplicación suma los golpes, los compara con el par del campo y actualiza las estadísticas.
- **Seguimiento del handicap.** Cada ronda contribuye a recalcular el nivel del jugador.
- **Análisis y gráficas.** Visualización de la evolución del juego para identificar tendencias y puntos débiles.
- **Datos reales de campos.** Integración con una API externa que proporciona información de miles de campos de golf.

---

## 🏗️ Arquitectura

La aplicación está construida como un conjunto de **servicios independientes contenerizados**, cada uno con una responsabilidad clara, comunicándose a través de una red privada y con un único punto de entrada al exterior.

```
                          Usuario (navegador)
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Nginx (proxy inverso)  │   ← único punto expuesto
                    └─────────────────────────┘
                        │                   │
                  /  (la web)          /api/ (la API)
                        │                   │
                        ▼                   ▼
              ┌──────────────┐      ┌──────────────┐
              │   Frontend   │      │   Backend    │
              │ React + Vite │      │   FastAPI    │
              └──────────────┘      └──────────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │    MySQL     │
                                    └──────────────┘
                                            │
                                            ▼
                                  Golf Course API (externa)
```

**¿Por qué esta arquitectura?** Separar la aplicación en servicios permite que cada parte (web, API, base de datos) se desarrolle, escale y despliegue de forma independiente. Nginx actúa como recepcionista: recibe todo el tráfico y lo dirige al servicio adecuado según la URL, además de centralizar la seguridad. Exponer un solo puerto al exterior reduce la superficie de ataque y simplifica enormemente la gestión del HTTPS en producción.

---

## 🛠️ Stack tecnológico y decisiones

Cada tecnología se ha elegido por un motivo concreto, no por moda. Aquí está el razonamiento detrás de cada una.

### Desarrollo de la aplicación

- **React + Vite** — React es el estándar de la industria para interfaces, y Vite ofrece un entorno de desarrollo muy rápido con recarga instantánea.
- **FastAPI (Python)** — framework moderno para APIs REST. Genera documentación interactiva automáticamente y es muy legible, ideal para un proyecto que debe poder explicarse y mantenerse.
- **MySQL** — base de datos relacional. Los datos del proyecto (usuarios, rondas, hoyos) están muy relacionados entre sí, por lo que un modelo relacional encaja mejor que uno NoSQL. Además, las consultas estadísticas (medias, agrupaciones) se resuelven con SQL de forma natural.
- **JWT + bcrypt** — para la autenticación. Las contraseñas nunca se guardan en claro: se cifran con bcrypt. Las sesiones se gestionan con tokens JWT, el estándar para APIs REST sin estado.

### Infraestructura y DevOps

- **Docker + Docker Compose** — contenerización. Garantiza que la aplicación funcione igual en cualquier máquina, eliminando el clásico "en mi equipo funcionaba". Todo el entorno se levanta con un solo comando.
- **Nginx** — proxy inverso y servidor web. Dirige el tráfico y, en producción, gestiona el certificado HTTPS.
- **GitHub Actions** — integración continua. Cada cambio se valida automáticamente antes de integrarse.
- **AWS EC2, Cloudflare y Let's Encrypt** — previstos para el despliegue en producción con dominio propio y HTTPS.

### Servicios externos

- **Golf Course API** — proporciona los datos de los campos de golf, evitando tener que introducirlos manualmente.

---

## 🗄️ Modelo de datos

El esquema relacional se compone de cinco tablas conectadas entre sí:

| Tabla | Qué guarda |
|-------|------------|
| `users` | Usuarios registrados y su handicap |
| `courses` | Campos de golf |
| `holes` | Los hoyos de cada campo, con su par y distancia |
| `rounds` | Las rondas jugadas por cada usuario |
| `hole_scores` | La puntuación de cada hoyo dentro de una ronda |

Las relaciones clave: un **usuario** tiene muchas **rondas**; un **campo** tiene muchos **hoyos**; y cada **ronda** contiene las **puntuaciones** de los hoyos jugados. La integridad de los datos se protege mediante claves foráneas y borrado en cascada, de modo que nunca queden registros huérfanos.

---

## ⚙️ Integración continua

El repositorio cuenta con un pipeline de **GitHub Actions** que se ejecuta automáticamente en cada `push` o `pull request` a la rama principal. Su función es actuar como una red de seguridad: valida que cualquier cambio no rompe el proyecto antes de integrarlo.

El workflow realiza tres comprobaciones:

1. **Frontend** — instala dependencias y compila la aplicación React, detectando errores de build.
2. **Backend** — instala las dependencias de Python y verifica que la API arranca sin errores.
3. **Docker** — construye todas las imágenes para garantizar que el sistema completo se monta correctamente.

Esto reproduce una práctica habitual en equipos profesionales y permite detectar fallos de forma temprana, en lugar de descubrirlos al integrar el trabajo de ambos.

---

## 🚀 Puesta en marcha

### Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (solo necesario para desarrollar el frontend)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/menesitoos26/GolfTracker.git
cd GolfTracker
```


> ⚠️ El archivo `.env` contiene información sensible y **no se incluye en el repositorio** por seguridad.

```bash
# 2. Levantar todo el entorno
cd docker
docker compose up -d --build
```

### Acceso

| Servicio | URL |
|----------|-----|
| Aplicación web | http://localhost |
| API | http://localhost/api/ |
| Documentación de la API | http://localhost/api/docs |

### Desarrollo del frontend

Para trabajar en la interfaz con recarga instantánea, sin reconstruir Docker en cada cambio:

```bash
cd frontend
npm install
npm run dev   # disponible en http://localhost:5173
```

---

## 📂 Estructura del repositorio

```
GolfTracker/
├── backend/                # API REST con FastAPI
│   └── app/
│       ├── main.py         # Punto de entrada
│       ├── core/           # Seguridad, esquemas y dependencias
│       ├── db/             # Conexión a la base de datos
│       └── routers/        # Endpoints (auth, rondas, estadísticas)
├── frontend/               # Aplicación web con React + Vite
│   └── src/secciones/      # Vistas y componentes
├── docker/                 # Orquestación del entorno
│   ├── docker-compose.yml
│   ├── init.sql            # Esquema inicial de la base de datos
│   └── nginx/              # Configuración del proxy inverso
├── .github/workflows/      # Pipeline de integración continua
└── README.md
```

---

## 👥 Equipo y reparto del trabajo

El proyecto se ha organizado en dos áreas de responsabilidad bien diferenciadas, replicando la dinámica de un equipo de desarrollo real:

| Área | Responsable | Trabajo |
|------|-------------|---------|
| **Infraestructura y DevOps** | Alejandro Meneses | Contenerización con Docker, configuración de Nginx, integración continua con GitHub Actions, diseño de la arquitectura, despliegue y seguridad. |
| **Desarrollo de la aplicación** | Juan López | Frontend en React, backend en FastAPI, modelo de datos y lógica de negocio. |

Esta separación ha permitido trabajar en paralelo y aplicar un flujo de trabajo profesional basado en ramas, pull requests y entregas incrementales.

---


<div align="center">

*Proyecto desarrollado como Trabajo Fin de Grado del ciclo de Desarrollo de Aplicaciones Web.*

</div>