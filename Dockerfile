FROM node:22-bookworm-slim AS builder

WORKDIR /app

# --ignore-scripts skips Playwright's postinstall browser download. The image
# build only renders pages and compiles CSS; the resume PDFs and the Open Graph
# images are generated locally and committed under public/, because generating
# them here means `playwright install --with-deps`, which is ~100MB of apt
# packages pulled on every push. `npm run build:pages` fails if those committed
# artifacts no longer match the content.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build:pages

FROM nginx:1.29-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
