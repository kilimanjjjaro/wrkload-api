FROM node:26.13.1-alpine

ENV NODE_ENV=production

WORKDIR /app

RUN npm install --global pnpm@11.20.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY src ./src

USER node

EXPOSE 5000

CMD ["node", "src/index.ts"]
