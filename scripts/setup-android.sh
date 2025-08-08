
#!/bin/bash

echo "🚀 Configuración Android - Gesture Alert Vision"
echo "=============================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ Node.js y npm disponibles"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir proyecto
echo "🔨 Construyendo proyecto..."
npm run build

# Verificar si existe directorio android
if [ -d "android" ]; then
    echo "🧹 Removiendo configuración Android anterior..."
    rm -rf android
fi

# Agregar plataforma Android
echo "📱 Agregando plataforma Android..."
npx cap add android

# Sincronizar
echo "🔄 Sincronizando proyecto..."
npx cap sync android

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. npx cap open android    # Abrir en Android Studio"
echo "2. Build → Build APK       # Generar APK"
echo ""
echo "📱 El APK se creará en: android/app/build/outputs/apk/debug/"
