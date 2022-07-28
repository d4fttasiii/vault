FROM node:16 AS base
WORKDIR /app
 
FROM node:16 AS build
WORKDIR /build
COPY . .
RUN yarn install
RUN yarn build

# copy output 
FROM base AS final
COPY --from=build build /app

WORKDIR /app/dist/
EXPOSE 3000
ENTRYPOINT ["node", "main"]