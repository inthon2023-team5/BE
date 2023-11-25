FROM node:18.11.0-alpine

WORKDIR /app

ADD . /app/

RUN npm install

RUN npm run build

EXPOSE 3080

ENTRYPOINT npm run start:prod