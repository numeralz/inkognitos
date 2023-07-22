FROM golang:alpine AS production

ENV GOPATH="$HOME/go"
ENV PATH="$GOPATH/bin:$PATH"

COPY . /app/
WORKDIR /app 

RUN go build -o main  ./src/...

RUN adduser -S -D -H -h /app appuser
USER appuser

CMD ["./main"]

# -----------------------------------
FROM golang AS development

ENV GOPATH="$HOME/go"
ENV PATH="$GOPATH/bin:$PATH"

RUN go install github.com/mitranim/gow@latest

COPY . /app/
WORKDIR /app 

CMD gow run ./src
