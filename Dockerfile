FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4802 DATA_DIR=/data
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server/server.js ./
COPY server/public ./public
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME ["/data"]
EXPOSE 4802
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4802/health || exit 1
CMD ["node", "server.js"]
