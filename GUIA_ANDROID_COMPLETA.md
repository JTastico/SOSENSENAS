
# Guía Completa: Crear APK desde cero

## 📋 Prerrequisitos

1. **Android Studio** instalado con:
   - Android SDK (API 33 o superior)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools

2. **Java Development Kit (JDK) 11 o superior**

3. **Node.js 18+** y **npm**

## 🚀 Pasos paso a paso

### Paso 1: Preparar el proyecto
```bash
# Instalar dependencias
npm install

# Construir el proyecto
npm run build
```

### Paso 2: Inicializar Capacitor (primera vez)
```bash
# Si no tienes Capacitor CLI instalado globalmente
npm install -g @capacitor/cli

# Verificar que capacitor.config.ts existe y está correcto
npx cap doctor
```

### Paso 3: Agregar plataforma Android
```bash
# Agregar Android (elimina carpeta android si existe)
npx cap add android
```

### Paso 4: Sincronizar proyecto
```bash
# Sincronizar archivos web con Android
npx cap sync android
```

### Paso 5: Abrir en Android Studio
```bash
# Abrir proyecto en Android Studio
npx cap open android
```

### Paso 6: Configurar en Android Studio

1. **Esperar sincronización automática**
2. **Tools → SDK Manager**:
   - Instalar Android API 33 (Android 13)
   - Instalar Build Tools 33.0.0+

3. **File → Sync Project with Gradle Files**

### Paso 7: Generar APK
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Esperar compilación
3. APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🔧 Comandos útiles

### Para desarrollo:
```bash
# Ejecutar en emulador/dispositivo
npx cap run android

# Ver logs en tiempo real
npx cap run android --consolelogs

# Sincronizar después de cambios
npm run build && npx cap sync android
```

### Para debugging:
```bash
# Verificar configuración
npx cap doctor

# Limpiar y reconstruir
npx cap sync android --force

# Ver información del dispositivo
adb devices
```

## ⚠️ Solución de problemas comunes

### Error: ANDROID_HOME not set
```bash
# Windows
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Error: Gradle build failed
1. Abrir Android Studio
2. File → Invalidate Caches and Restart
3. Build → Clean Project
4. Build → Rebuild Project

### Error: App crashes al abrir
1. Verificar permisos en AndroidManifest.xml
2. Revisar logs: `npx cap run android --consolelogs`
3. Verificar que la app se construyó: `npm run build`

## 📱 Funcionalidades habilitadas

✅ **Cámara** - Para detección de gestos
✅ **Text-to-Speech** - Para alertas de voz
✅ **Almacenamiento** - Para configuraciones
✅ **Internet** - Para funcionalidades web
✅ **Vibración** - Para notificaciones

## 🎯 APK final

El APK se genera en:
`android/app/build/outputs/apk/debug/app-debug.apk`

Este archivo se puede instalar directamente en cualquier dispositivo Android.
