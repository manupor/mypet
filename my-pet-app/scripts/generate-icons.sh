#!/bin/bash

# Script para generar iconos PWA desde un SVG base
# Requiere: ImageMagick (brew install imagemagick)

SOURCE="public/favicon.svg"
OUTPUT="public"

# Generar iconos PNG desde SVG
convert -background none -resize 64x64 $SOURCE $OUTPUT/pwa-64x64.png
convert -background none -resize 192x192 $SOURCE $OUTPUT/pwa-192x192.png
convert -background none -resize 512x512 $SOURCE $OUTPUT/pwa-512x512.png
convert -background none -resize 180x180 $SOURCE $OUTPUT/apple-touch-icon.png

# Generar icono maskable (con padding y fondo)
convert -background "#6366f1" -gravity center -resize 400x400 -extent 512x512 $SOURCE $OUTPUT/maskable-icon-512x512.png

echo "✅ Iconos PWA generados en $OUTPUT/"
