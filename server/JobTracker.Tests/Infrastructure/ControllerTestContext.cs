namespace JobTracker.Tests.Infrastructure;

public sealed class ControllerTestContext(string userId)
{
    private readonly ClaimsPrincipal _user = new(
        new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId)],
            authenticationType: "TestAuthentication"
        )
    );

    public TController AttachTo<TController>(TController controller)
        where TController : ControllerBase
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = _user,
            },
        };

        return controller;
    }
}
