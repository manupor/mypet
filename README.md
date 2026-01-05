# 🐾 My Pet - Plataforma SaaS para Veterinarias

Sistema completo de gestión veterinaria con aplicación móvil para clientes y panel de administración para veterinarias.

## 📁 Estructura del Proyecto

```
mypet/
├── my-pet-api/          # Backend API (Node.js + Express + SQLite)
├── my-pet-app/          # App Cliente PWA (React + Vite + TailwindCSS)
└── my-pet-dashboard/    # Panel Veterinarias (React + Vite + TailwindCSS)
```

## 🚀 Características

### App Cliente (my-pet-app)
- 📱 PWA instalable en iOS y Android
- 🔐 Login con Email, Google y Facebook
- 🐕 Perfil de mascotas con pasaporte digital
- 💉 Historial de vacunas y recordatorios
- 🏥 Historial de servicios veterinarios
- 🎁 Programa de lealtad con puntos

### Panel Veterinarias (my-pet-dashboard)
- 👥 Gestión de clientes y mascotas
- 📋 Expedientes médicos digitales
- 💉 Control de vacunación
- 🛁 Registro de servicios (baños, consultas, etc.)
- 🎯 Programa de lealtad configurable
- 📊 Estadísticas y reportes

### Backend API (my-pet-api)
- 🔒 Autenticación JWT + OAuth (Google/Facebook)
- 🏢 Multi-tenant (múltiples veterinarias)
- 📄 Generación de PDFs (tarjetas, expedientes)
- ⏰ Recordatorios automáticos de vacunas
- 📧 Notificaciones por email

## 🛠️ Instalación

### Requisitos
- Node.js 18+
- npm o yarn

### Backend
```bash
cd my-pet-api
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run db:seed
npm run dev
```

### App Cliente
```bash
cd my-pet-app
npm install
npm run dev
```

### Panel Veterinarias
```bash
cd my-pet-dashboard
npm install
npm run dev
```

## 🔑 Credenciales Demo

**App Cliente:**
- Email: `cliente@demo.com`
- Password: `demo123`

**Panel Veterinarias:**
- Email: `admin@demo.com`
- Password: `demo123`

## 📱 URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Backend API | http://localhost:3000 |
| App Cliente | http://localhost:5173 |
| Panel Veterinarias | http://localhost:5174 |

## 🔧 Tecnologías

- **Backend:** Node.js, Express, TypeScript, SQLite, JWT, Passport
- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Query, Zustand
- **PWA:** Vite PWA Plugin, Service Workers

## 📄 Licencia

MIT License
