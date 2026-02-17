# Stage 1: Vue build
FROM node:22-alpine AS vue-build
WORKDIR /vue
COPY src/Allet.Vue/package.json src/Allet.Vue/package-lock.json ./
RUN npm ci
COPY src/Allet.Vue/ .
RUN npm run build

# Stage 2: .NET build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dotnet-build
WORKDIR /src
COPY src/Allet.ServiceDefaults/*.csproj src/Allet.ServiceDefaults/
COPY src/Allet.Web/*.csproj src/Allet.Web/
RUN dotnet restore src/Allet.Web/Allet.Web.csproj
COPY src/Allet.ServiceDefaults/ src/Allet.ServiceDefaults/
COPY src/Allet.Web/ src/Allet.Web/
RUN dotnet publish src/Allet.Web/Allet.Web.csproj -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
WORKDIR /app
EXPOSE 8080
COPY --from=dotnet-build /app/publish .
COPY --from=vue-build /vue/dist ./wwwroot
ENTRYPOINT ["dotnet", "Allet.Web.dll"]
