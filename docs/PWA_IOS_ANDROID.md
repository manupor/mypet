# Instalación PWA en iOS y Android

## ✅ Requisitos cumplidos para App Stores

### iOS (Safari)
- ✅ `apple-mobile-web-app-capable`: Permite pantalla completa
- ✅ `apple-mobile-web-app-status-bar-style`: Estilo de barra de estado
- ✅ `apple-touch-icon`: Icono para pantalla de inicio
- ✅ `viewport-fit=cover`: Soporte para notch/Dynamic Island
- ✅ HTTPS requerido en producción

### Android (Chrome)
- ✅ `manifest.json` con iconos y configuración
- ✅ Service Worker para funcionamiento offline
- ✅ Icono maskable para adaptative icons
- ✅ `display: standalone` para experiencia de app
- ✅ `theme-color` para barra de navegación

## 📱 Cómo instalar la PWA

### iOS (iPhone/iPad)
1. Abre la app en **Safari** (no funciona en otros navegadores)
2. Toca el botón **Compartir** (cuadrado con flecha)
3. Desplázate y selecciona **"Añadir a pantalla de inicio"**
4. Confirma el nombre y toca **"Añadir"**

### Android
1. Abre la app en **Chrome**
2. Aparecerá un banner de instalación automático, o:
3. Toca el menú ⋮ → **"Instalar app"** o **"Añadir a pantalla de inicio"**
4. Confirma la instalación

## 🖼️ Generar iconos

Necesitas generar los iconos PNG desde el SVG:

```bash
# Instalar ImageMagick (Mac)
brew install imagemagick

# Generar iconos
cd my-pet-app
chmod +x scripts/generate-icons.sh
./scripts/generate-icons.sh
```

### Iconos requeridos
| Archivo | Tamaño | Uso |
|---------|--------|-----|
| `pwa-64x64.png` | 64x64 | Favicon pequeño |
| `pwa-192x192.png` | 192x192 | Android splash/icon |
| `pwa-512x512.png` | 512x512 | Android install icon |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `maskable-icon-512x512.png` | 512x512 | Android adaptive icon |

## 🔒 HTTPS

La PWA requiere HTTPS para:
- Service Workers
- Push Notifications
- Geolocalización
- Cámara/Micrófono

En desarrollo, `localhost` está exento de este requisito.

## 📊 Verificar PWA

### Lighthouse (Chrome DevTools)
1. Abre DevTools (F12)
2. Ve a pestaña **Lighthouse**
3. Selecciona **Progressive Web App**
4. Click **Analyze page load**

### Criterios de Google
- ✅ Registra un Service Worker
- ✅ Responde con 200 cuando está offline
- ✅ Contiene contenido cuando JavaScript está deshabilitado
- ✅ Usa HTTPS
- ✅ Redirige HTTP a HTTPS
- ✅ Carga rápido en 3G
- ✅ La página y recursos están cacheados

## 🚀 Publicar en App Stores

### Google Play Store (TWA)
Puedes envolver la PWA como Trusted Web Activity:

1. Usa [PWA Builder](https://www.pwabuilder.com/)
2. Ingresa tu URL de producción
3. Genera el paquete Android
4. Sube a Google Play Console

### Apple App Store
Apple no permite PWAs directamente, pero puedes:

1. Crear un wrapper nativo con **Capacitor** o **Cordova**
2. O usar servicios como **PWA Builder** para generar un .ipa

```bash
# Con Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npm run build
npx cap sync
npx cap open ios  # Abre en Xcode
npx cap open android  # Abre en Android Studio
```

## 📋 Checklist final

- [ ] Iconos generados en todos los tamaños
- [ ] manifest.json válido
- [ ] Service Worker registrado
- [ ] Funciona offline (al menos página básica)
- [ ] HTTPS configurado en producción
- [ ] Meta tags de iOS presentes
- [ ] theme-color configurado
- [ ] Lighthouse PWA score > 90
