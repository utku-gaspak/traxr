using api.Dtos.Account;
using api.Interface;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[Route("api/account")]
[ApiController]
public class AccountController(
    UserManager<AppUser> userManager,
    ITokenService tokenService,
    SignInManager<AppUser> signInManager
) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(NewUserDto), StatusCodes.Status200OK)] // Dönüş tipini buraya yazdık
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var appUser = new AppUser
            {
                UserName = registerDto.Username,
                Email = registerDto.Email,
            };
            //userManager interacts with user db via CRUD.
            // Şifreyi kendimiz hash'lemiyoruz, Identity arka planda güvenli şekilde hallediyor.
            var createdUser = await userManager.CreateAsync(appUser, registerDto.Password!);

            if (createdUser.Succeeded)
            {
                // Kullanıcı başarıyla oluştuysa hemen ona bir anahtar veriyoruz
                return Ok(
                    new NewUserDto
                    {
                        UserName = appUser.UserName,
                        Email = appUser.Email,
                        Token = tokenService.CreateToken(appUser),
                    }
                );
            }

            return BadRequest(createdUser.Errors);
        }
        catch (Exception e)
        {
            return StatusCode(500, e.Message);
        }
    }

    [HttpPost("login")]
    [Produces("application/json")] // <--- NSwag'e "Ben JSON dönüyorum" de
    [ProducesResponseType(typeof(NewUserDto), StatusCodes.Status200OK)] // <[ProducesResponseType(typeof(NewUserDto), StatusCodes.Status200OK)] // <--- BU SATIR KRİTİ[ProducesResponseType(typeof(NewUserDto), StatusCodes.Status200OK)] // <--- BU SATIR KRİTİKK--- BU SATIR KRİTİK
    public async Task<IActionResult> Login(LoginDto loginDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // 1. Kullanıcıyı veritabanında bul (Email veya Username ile)
        var user = await userManager.Users.FirstOrDefaultAsync(x =>
            x.UserName == loginDto.Username
        );

        if (user == null)
            return Unauthorized("Geçersiz kullanıcı adı!");

        //signInManager Session ve password verifizieren.
        // 2. Şifreyi kontrol et
        var result = await signInManager.CheckPasswordSignInAsync(user, loginDto.Password!, false);

        if (!result.Succeeded)
            return Unauthorized("Kullanıcı adı veya şifre hatalı!");

        // 3. Her şey tamamsa yeni bir Token üret ve kullanıcıya dön
        return Ok(
            new NewUserDto
            {
                UserName = user.UserName,
                Email = user.Email,
                Token = tokenService.CreateToken(user),
            }
        );
    }
}
