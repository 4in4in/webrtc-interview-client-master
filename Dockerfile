FROM node:10.19.0

WORKDIR /app/

COPY . .

RUN npm install

RUN npm run-script build

EXPOSE 6970

CMD npm start