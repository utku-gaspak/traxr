using api;
using Microsoft.Extensions.Configuration;

namespace JobTracker.Tests;

public class RequiredConfigurationTests
{
    [Fact]
    public void GetDefaultConnection_ConfiguredConnection_ShouldReturnConnectionString()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "Host=localhost;Database=test",
                }
            )
            .Build();

        var connectionString = RequiredConfiguration.GetDefaultConnection(configuration);

        connectionString.Should().Be("Host=localhost;Database=test");
    }

    [Fact]
    public void GetDefaultConnection_MissingDefaultConnection_ShouldFailClearly()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection([]).Build();

        var act = () => RequiredConfiguration.GetDefaultConnection(configuration);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("ConnectionStrings:DefaultConnection is not configured.");
    }
}
