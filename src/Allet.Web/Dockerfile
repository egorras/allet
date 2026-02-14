FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/Allet.Web/Allet.Web.csproj src/Allet.Web/
RUN dotnet restore src/Allet.Web/Allet.Web.csproj

COPY src/Allet.Web/ src/Allet.Web/
RUN dotnet publish src/Allet.Web/Allet.Web.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Allet.Web.dll"]
