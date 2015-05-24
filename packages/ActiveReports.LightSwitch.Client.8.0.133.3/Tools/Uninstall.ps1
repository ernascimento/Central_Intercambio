param($installPath, $toolsPath, $package, $project)

# Get full paths of default.htm and its backup

$default = $project.ProjectItems | Where-Object { $_.Name -eq "default.htm" }
$dst = $default.Properties.Item("FullPath").Value
$src = $dst -replace "default.htm", "default-backup.htm"

# Temporarily remove default.htm from the project

$default.Remove()

# Overwrite default.htm with the backup copy and re-add it to the project

Copy-Item $src $dst
$project.ProjectItems.AddFromFile($dst)
