param($installPath, $toolsPath, $package, $project)

# Determine if this project uses the 1.0.1, 2.0.0, or 2.5.x runtime
$newDefault = "default-2.5.0.htm";

# Find the script type project in the current solution
$scripts = $project.ProjectItems.Item("Scripts")
if ($scripts -ne $null)
{
    if ($scripts.ProjectItems.Item("msls-2.5.2.js") -ne $null)
    {
        $newDefault = "default-2.5.2.htm";
    }
    elseif ($scripts.ProjectItems.Item("msls-2.5.2.min.js") -ne $null)
    {
        $newDefault = "default-2.5.2.htm";
    }

    elseif ($scripts.ProjectItems.Item("msls-2.5.1.js") -ne $null)
    {
        $newDefault = "default-2.5.1.htm";
    }
    elseif ($scripts.ProjectItems.Item("msls-2.5.1.min.js") -ne $null)
    {
        $newDefault = "default-2.5.1.htm";
    }

    elseif ($scripts.ProjectItems.Item("msls-2.5.0.js") -ne $null)
    {
        $newDefault = "default-2.5.0.htm";
    }
    elseif ($scripts.ProjectItems.Item("msls-2.5.0.min.js") -ne $null)
    {
        $newDefault = "default-2.5.0.htm";
    }

    elseif ($scripts.ProjectItems.Item("msls-2.0.0.js") -ne $null)
    {
        $newDefault = "default-2.0.0.htm";
    }
    elseif ($scripts.ProjectItems.Item("msls-2.0.0.min.js") -ne $null)
    {
        $newDefault = "default-2.0.0.htm";
    }

    elseif ($scripts.ProjectItems.Item("msls-1.0.1.js") -ne $null)
    {
        $newDefault = "default-1.0.1.htm";
    }
    elseif ($scripts.ProjectItems.Item("msls-1.0.1.min.js") -ne $null)
    {
        $newDefault = "default-1.0.1.htm";
    }
}

# Make a backup copy of default.htm

$default = $project.ProjectItems | Where-Object { $_.Name -eq "default.htm" }
$src = [System.IO.Path]::GetDirectoryName($project.Properties.Item("FullPath").Value) + "\default.htm"
$dst = $src -replace "default.htm", "default-backup.htm"
Copy-Item $src $dst

# Temporarily remove default.htm from the project

$default.Remove()

# Overwrite default.htm with the appropriate version and re-add it to the project

$dst = $src -replace "default.htm", $newDefault
Copy-Item $dst $src
$project.ProjectItems.AddFromFile($src)
