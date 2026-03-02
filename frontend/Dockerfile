FROM oven/bun:latest

WORKDIR /frontend

COPY package.json bun.lock ./

COPY . .

RUN bun install

EXPOSE 3000

CMD ["bun", "run", "dev"]