FROM nginx:1.31.6-alpine3.24

COPY index.html /usr/share/nginx/html/

COPY docker-entrypoint.d/40-dash0-init.sh /docker-entrypoint.d/40-dash0-init.sh
RUN chmod +x /docker-entrypoint.d/40-dash0-init.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
