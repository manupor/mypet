# My Pet API

Backend API para el sistema My Pet - Gestión de veterinarias y mascotas.

## Características

- 🔐 Autenticación con Email, Google y Facebook
- 🏥 Multi-tenant SaaS para múltiples veterinarias
- 🐾 Expedientes médicos completos
- 💉 Gestión de vacunas con recordatorios automáticos
- 🎁 Programa de lealtad (puntos + "5to baño gratis")
- 📄 Generación de reportes PDF
- 🔔 Notificaciones por email

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Crear carpeta de uploads
mkdir -p uploads/pets

# Inicializar base de datos con datos de demo
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

Edita el archivo `.env` con tus credenciales:

```env
# OAuth (opcional para desarrollo)
GOOGLE_CLIENT_ID=tu-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
FACEBOOK_APP_ID=tu-app-id
FACEBOOK_APP_SECRET=tu-app-secret

# Email (opcional para desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

## Endpoints Principales

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Login usuario |
| GET | `/api/auth/google` | Login con Google |
| GET | `/api/auth/facebook` | Login con Facebook |
| POST | `/api/auth/staff/login` | Login staff veterinaria |
| POST | `/api/auth/veterinary/register` | Registrar veterinaria |

### Mascotas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/pets/my-pets` | Mis mascotas (usuario) |
| GET | `/api/pets` | Listar mascotas (staff) |
| POST | `/api/pets` | Crear mascota |
| PUT | `/api/pets/:id` | Actualizar mascota |
| POST | `/api/pets/:id/passport` | Agregar/actualizar pasaporte |

### Expedientes Médicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/medical/my-records` | Mis expedientes (usuario) |
| GET | `/api/medical/pet/:petId` | Expedientes de mascota |
| POST | `/api/medical` | Crear registro médico |

### Vacunas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/vaccines/my-vaccines` | Mis vacunas (usuario) |
| GET | `/api/vaccines/my-reminders` | Próximas vacunas |
| GET | `/api/vaccines/pending` | Vacunas pendientes (staff) |
| POST | `/api/vaccines` | Registrar vacuna |

### Programa de Lealtad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/loyalty/my-cards` | Mis tarjetas de lealtad |
| GET | `/api/loyalty/client/:id` | Tarjeta de cliente (staff) |
| POST | `/api/loyalty/process-service` | Procesar servicio con lealtad |
| POST | `/api/loyalty/add-points` | Agregar puntos manualmente |
| POST | `/api/loyalty/redeem` | Canjear puntos |

### Reportes PDF

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reports/pet-card/:petId` | Tarjeta de mascota (PDF) |
| GET | `/api/reports/medical-report/:petId` | Expediente completo (PDF) |
| GET | `/api/reports/client-report/:clientId` | Reporte de cliente (PDF) |

## Credenciales de Demo

```
Dashboard (Staff):
  Email: admin@demo.com
  Password: demo123

App (Cliente):
  Email: cliente@demo.com
  Password: demo123
```

## Estructura del Proyecto

```
src/
├── config/          # Configuración (passport, etc.)
├── database/        # Inicialización y seeds
├── middleware/      # Auth, error handling
├── routes/          # Endpoints de la API
├── services/        # Lógica de negocio (email, reminders)
└── utils/           # Utilidades (JWT, etc.)
```

## Programa de Lealtad

El sistema de lealtad funciona de la siguiente manera:

1. **Puntos por servicio**: Cada servicio otorga puntos configurables
2. **Servicios con umbral**: Por ejemplo, baños con `loyalty_threshold: 4` significa que cada 4 baños pagados, el 5to es gratis
3. **Canje de puntos**: Los puntos acumulados pueden canjearse por descuentos

## Licencia

MIT
