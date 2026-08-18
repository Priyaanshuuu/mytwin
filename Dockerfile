FROM node:22-slim

WORKDIR /app

RUN apt-get update -qq \
    && apt-get install --no-install-recommends -y ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "agent:start"]