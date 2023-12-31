// Initializing these fields to some default value may not be the best idea
// in this case because it can mask potential bugs in your code.
// And making them nullable would contradict with your [Required] data annotation.
// So, we are using #nullable disable and #nullable restore to disable nullable warnings

#nullable disable
namespace Backend.DTOs.Team;

public class UpdateTeamDto
{
    public string Name { get; set; }
    public Guid SportId { get; set; }
}

#nullable restore