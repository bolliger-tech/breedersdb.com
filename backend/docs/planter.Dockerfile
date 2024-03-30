FROM golang:1.22

WORKDIR /app

RUN go install github.com/cyrillbolliger/planter

ENV DATABASE_URL=${DATABASE_URL}
ENV SCHEMA=${SCHEMA:-public}
ENV OUTPUT=${OUTPUT:-erd.puml}
ENV TABLES=${TABLES}
ENV EXCLUDE=${EXCLUDE}
ENV TITLE=${TITLE}

CMD ["planter", "--schema", "${SCHEMA}", "--output", "${OUTPUT}", "--table", "${TABLES}", "--exclude", "${EXCLUDE}", "--title", "${TITLE}", "${DATABASE_URL}"]