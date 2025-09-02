FROM node:22-alpine AS builder

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN echo "DATABASE_URL during build: $DATABASE_URL"

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma

RUN npm install

COPY . .

# RUN npm run db:dev:deploy

RUN npm run build

CMD [ "npm", "start" ]
