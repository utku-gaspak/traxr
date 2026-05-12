using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddInterestAndTechnicalStack : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InterestLevel",
                table: "JobApplications",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnicalStack",
                table: "JobApplications",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InterestLevel",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "TechnicalStack",
                table: "JobApplications");
        }
    }
}
