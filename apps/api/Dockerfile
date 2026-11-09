# API container (alternative to Vercel). `pnpm build` bundles everything — including the
# @hisab/shared workspace package and all npm dependencies — into dist/server.mjs,
# so the runtime image needs no node_modules.
FROM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @hisab/api...
RUN pnpm --filter @hisab/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.mjs"]
