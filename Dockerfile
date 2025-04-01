# Usa una imagen base adecuada para tu proyecto
FROM node:18

# Establece el directorio de trabajo dentro del contenedor  ----> MODIFICAR POR CADA DOCKERFILE
WORKDIR /courses-microfrontend

# Copia los archivos de tu proyecto al directorio de trabajo
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install --force
# RUN npm install axios --force
# RUN npm install @atlaskit/form --force
# RUN npm install @atlaskit/textfield --force
# RUN npm install @atlaskit/heading --force
# RUN npm install @atlaskit/button --force

# Copia el resto de los archivos del proyecto al directorio de trabajo
COPY . .

# Expone el puerto en el que se ejecuta tu aplicación ---> MODIFICAR POR CADA DOCKERFILE
EXPOSE 3014

# Comando para iniciar tu aplicación
CMD [ "npm", "start" ]