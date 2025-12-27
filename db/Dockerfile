FROM docker.io/library/mysql:8.0

COPY my.cnf /etc/mysql/conf.d/
COPY schema.sql /docker-entrypoint-initdb.d/
RUN chmod 644 /etc/mysql/conf.d/my.cnf /docker-entrypoint-initdb.d/schema.sql
