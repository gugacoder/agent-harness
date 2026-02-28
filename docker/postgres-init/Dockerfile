# PostgreSQL Initialization Container
# Cria databases adicionais (evolution, n8n) de forma idempotente
FROM postgres:15-alpine

WORKDIR /app

# Copiar script de inicializacao
COPY docker/postgres-init/init-databases.sh .
RUN chmod +x init-databases.sh

CMD ["./init-databases.sh"]
