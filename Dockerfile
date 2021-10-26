FROM node:current-alpine
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install && mkdir -p /app/data/bin
CMD node index.js
EXPOSE 42420
VOLUME /app/data
COPY . .

