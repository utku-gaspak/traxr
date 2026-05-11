using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace JobTracker.Tests.Infrastructure;

public static class IdentityManagerMocks
{
    public static Mock<UserManager<AppUser>> CreateUserManager()
    {
        return new Mock<UserManager<AppUser>>(
            Mock.Of<IUserStore<AppUser>>(),
            Mock.Of<IOptions<IdentityOptions>>(),
            Mock.Of<IPasswordHasher<AppUser>>(),
            Array.Empty<IUserValidator<AppUser>>(),
            Array.Empty<IPasswordValidator<AppUser>>(),
            Mock.Of<ILookupNormalizer>(),
            new IdentityErrorDescriber(),
            Mock.Of<IServiceProvider>(),
            Mock.Of<ILogger<UserManager<AppUser>>>()
        );
    }

    public static Mock<SignInManager<AppUser>> CreateSignInManager(
        UserManager<AppUser> userManager
    )
    {
        // SignInManager needs the full collaborator graph even when tests only stub CheckPasswordSignInAsync.
        return new Mock<SignInManager<AppUser>>(
            userManager,
            Mock.Of<IHttpContextAccessor>(),
            Mock.Of<IUserClaimsPrincipalFactory<AppUser>>(),
            Mock.Of<IOptions<IdentityOptions>>(),
            Mock.Of<ILogger<SignInManager<AppUser>>>(),
            Mock.Of<IAuthenticationSchemeProvider>(),
            Mock.Of<IUserConfirmation<AppUser>>()
        );
    }
}
