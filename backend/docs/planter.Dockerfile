FROM golang:1.22

WORKDIR /app

RUN git clone https://github.com/cyrillbolliger/planter.git .
RUN go build -o /usr/local/bin/planter
RUN rm -rf * .git*

ENV DATABASE_URL=${DATABASE_URL}
ENV SCHEMA=${SCHEMA:-public}
ENV OUTPUT=${OUTPUT:-erd.puml}
ENV TABLES=${TABLES}
ENV EXCLUDE=${EXCLUDE}
ENV TITLE=${TITLE}

CMD ["planter", "--schema", "${SCHEMA}", "--output", "${OUTPUT}", "--table", "${TABLES}", "--exclude", "${EXCLUDE}", "--title", "${TITLE}", "${DATABASE_URL}"]