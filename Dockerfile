FROM node:alpine as builder
COPY . .
RUN npm install
RUN npm run build

FROM node:alpine

RUN apk add --no-cache curl

COPY --from=builder dist/* dist/
COPY package.json .
COPY package-lock.json .
RUN npm install --production

CMD ["node", "dist/main.js"]