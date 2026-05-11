namespace api;

public static class RequiredConfiguration
{
    // Centralize required startup config checks so they stay testable outside Program.cs bootstrapping.
    public static string GetDefaultConnection(IConfiguration configuration)
    {
        var defaultConnection = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(defaultConnection))
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is not configured."
            );

        return defaultConnection;
    }
}
