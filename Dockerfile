FROM node:18.11.0-alpine

RUN apk add g++ make py3-pip

WORKDIR /app

ADD . /app/

RUN npm install

RUN npm run build

EXPOSE 3080

ENTRYPOINT npm run start:prod