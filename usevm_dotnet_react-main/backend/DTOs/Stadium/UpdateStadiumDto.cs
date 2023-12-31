// Initializing these fields to some default value may not be the best idea
// in this case because it can mask potential bugs in your code.
// And making them nullable would contradict with your [Required] data annotation.
// So, we are using #nullable disable and #nullable restore to disable nullable warnings

#nullable disable
namespace Backend.DTOs.Stadium;

public class UpdateStadiumDto
{
    public string Name { get; set; }
    public string Address { get; set; }
    public int Capacity { get; set; }
}

#nullable restore