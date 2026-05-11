using System.ComponentModel.DataAnnotations;

namespace api.Dtos.Account;

public class RegisterDto
{
    [Required]
    [MinLength(3, ErrorMessage = "Kullanıcı adı en az 3 karakter olmalı")]
    [MaxLength(20, ErrorMessage = "Kullanıcı adı en fazla 20 karakter olmalı")]
    public string? Username { get; set; }

    [Required]
    [EmailAddress(ErrorMessage = "Geçersiz email formatı")]
    public string? Email { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalı")]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
        ErrorMessage = "Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir."
    )]
    public string? Password { get; set; }
}
