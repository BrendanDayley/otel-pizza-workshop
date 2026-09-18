FROM node:20.20.2-alpine3.23

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Enable OpenTelemetry auto-instrumentation
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"

# Configure OpenTelemetry
ENV OTEL_SERVICE_NAME=delivery-service
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

EXPOSE 3002

CMD ["npm", "start"]
