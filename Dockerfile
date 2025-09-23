# Usar Node.js 18 LTS como imagen base
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /opt/app

# Instalar dependencias del sistema necesarias para Strapi
RUN apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    nasm \
    bash \
    vips-dev \
    python3 \
    make \
    g++

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production && npm cache clean --force

# Copiar el código fuente de la aplicación
COPY . .

# Crear directorio para uploads si no existe
RUN mkdir -p public/uploads

# Cambiar permisos
RUN chown -R node:node /opt/app
USER node

# Construir la aplicación Strapi
RUN npm run build

# Exponer el puerto
EXPOSE 1337

# Comando para iniciar la aplicación
CMD ["npm", "run", "develop"]
