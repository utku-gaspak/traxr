using NJsonSchema.CodeGeneration.TypeScript;
using NSwag;
using NSwag.CodeGeneration.TypeScript;
using NSwag.Generation;

namespace api.Etc;

public static class GenerateApiClientsExtensions
{
    // WebApplication sınıfına yeni bir yetenek ekliyoruz: OpenAPI'dan Client üretmek.
    public static async Task GenerateApiClientsFromOpenApi(this WebApplication app, string path)
    {
        // 1. ADIM: .NET içindeki OpenAPI (Swagger) döküman üreticisini çağırıyoruz.
        // "v1" isimli dökümanı (Program.cs'te tanımladığımız) hafızada oluşturur.
        var document = await app.Services.GetRequiredService<IOpenApiDocumentGenerator>()
            .GenerateAsync("v1");

        // 2. ADIM: Bu dökümanı standart bir JSON formatına çeviriyoruz.
        var openApiJson = document.ToJson();
        
        // 3. ADIM: Debug amaçlı olarak bu JSON'ı backend klasörüne 'openapi-with-docs.json' olarak kaydediyoruz.
        var openApiPath = Path.Combine(Directory.GetCurrentDirectory(), "openapi-with-docs.json");
        await File.WriteAllTextAsync(openApiPath, openApiJson);
        
        // Bu JSON'ı NSwag'in anlayacağı bir döküman nesnesine geri dönüştürüyoruz.
        var documentFromJson = await OpenApiDocument.FromJsonAsync(openApiJson);

        // 4. ADIM: TypeScript kodunun nasıl üretileceğine dair kuralları belirliyoruz.
        var settings = new TypeScriptClientGeneratorSettings
        {
            // 'Fetch' kullanarak ekstra kütüphane (Axios vb.) bağımlılığını ortadan kaldırıyoruz.
            Template = TypeScriptTemplate.Fetch,
            
            TypeScriptGeneratorSettings =
            {
                // Karmaşık Class'lar yerine hafif Interface'ler üretiyoruz.
                TypeStyle = TypeScriptTypeStyle.Interface,
                // Tarihleri yönetmesi kolay olsun diye 'string' (ISO formatı) olarak tutuyoruz.
                DateTimeType = TypeScriptDateTimeType.String,
                // Null değerleri 'undefined' olarak işaretleyerek TypeScript standartlarına uyuyoruz.
                NullValue = TypeScriptNullValue.Undefined,
                TypeScriptVersion = 5.2m,
                GenerateCloneMethod = false, // Gereksiz kod kalabalığını engeller.
                MarkOptionalProperties = true, // Opsiyonel alanları '?' ile işaretler.
                GenerateConstructorInterface = true,
                ConvertConstructorInterfaceData = true
            }
        };

        // 5. ADIM: Jeneratörü çalıştırıp TypeScript kodunu üretiyoruz.
        var generator = new TypeScriptClientGenerator(documentFromJson, settings);
        var code = generator.GenerateFile();

        // 6. ADIM: Dosyanın kaydedileceği yolu (Frontend klasörü) hazırlıyoruz.
        // Eğer klasör yoksa (src/api vb.) otomatik olarak oluşturur.
        var outputPath = Path.Combine(Directory.GetCurrentDirectory() + path);
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);

        // 7. ADIM: Üretilen devasa TypeScript kodunu belirtilen dosyaya yazıyoruz.
        await File.WriteAllTextAsync(outputPath, code);
        
        // Loglama: İşlemin başarıyla bittiğini terminale yazar.
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("OpenAPI JSON with documentation saved at: " + openApiPath);
        logger.LogInformation("TypeScript client generated at: " + outputPath);
    }
}