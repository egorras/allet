var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .AddDatabase("allet-db", "allet");

builder.AddProject<Projects.Allet_Web>("allet-web")
    .WithReference(postgres)
    .WaitFor(postgres);

builder.Build().Run();
