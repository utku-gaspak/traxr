using api.Models;

namespace api.Interface;

public interface ITokenService
{
    string CreateToken(AppUser user);
}
