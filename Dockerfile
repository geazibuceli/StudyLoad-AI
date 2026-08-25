FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node models ./models
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

CMD ["npm", "start"]
