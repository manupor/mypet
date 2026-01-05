# Configuración de Google OAuth

## Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID**

## Paso 2: Habilitar API

1. Ve a **APIs & Services** → **Library**
2. Busca "Google+ API" y habilítala
3. Busca "Google Identity" y habilítala

## Paso 3: Configurar pantalla de consentimiento

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Selecciona **External** (para usuarios públicos)
3. Completa la información:
   - **App name:** My Pet
   - **User support email:** tu email
   - **Developer contact:** tu email
4. En **Scopes**, agrega:
   - `email`
   - `profile`
   - `openid`
5. Guarda y continúa

## Paso 4: Crear credenciales OAuth

1. Ve a **APIs & Services** → **Credentials**
2. Click en **Create Credentials** → **OAuth client ID**
3. Selecciona **Web application**
4. Configura:
   - **Name:** My Pet Web Client
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     http://localhost:5173
     https://tu-dominio.com
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/api/auth/google/callback
     https://tu-api.com/api/auth/google/callback
     ```
5. Click **Create**
6. Copia el **Client ID** y **Client Secret**

## Paso 5: Configurar variables de entorno

Edita el archivo `my-pet-api/.env`:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
```

## Paso 6: Reiniciar el servidor

```bash
cd my-pet-api
npm run dev
```

## Paso 7: Probar

1. Ve a http://localhost:5173/login
2. Click en el botón "Google"
3. Deberías ser redirigido a la pantalla de login de Google

## Solución de problemas

### Error: "redirect_uri_mismatch"
- Verifica que la URI de callback coincida exactamente en Google Console
- La URL debe ser: `http://localhost:3000/api/auth/google/callback`

### Error: "access_denied"
- Verifica que la app esté en modo de prueba y tu email esté en la lista de usuarios de prueba
- O publica la app para producción

### Error: "invalid_client"
- Verifica que el Client ID y Secret sean correctos en `.env`
- Reinicia el servidor después de cambiar `.env`

## Producción

Para producción, actualiza las URLs en Google Console:
- **Authorized JavaScript origins:** `https://tu-app.netlify.app`
- **Authorized redirect URIs:** `https://tu-api.railway.app/api/auth/google/callback`

Y en `.env`:
```env
API_URL=https://tu-api.railway.app
CLIENT_URL=https://tu-app.netlify.app
```
