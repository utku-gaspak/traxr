namespace api;

public static class RequiredConfiguration
{
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
