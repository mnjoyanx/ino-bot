FROM node:16 AS builder

WORKDIR app

COPY . .
                
RUN npm install

RUN npm run build

FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/build .


COPY set_api_host.sh /usr/share/nginx/html//set_api_host.sh

RUN chmod +x /usr/share/nginx/html/set_api_host.sh

EXPOSE 80

CMD ["sh", "-c", "sh /usr/share/nginx/html/set_api_host.sh && nginx -g 'daemon off;'"]

