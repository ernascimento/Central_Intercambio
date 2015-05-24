param($installPath, $toolsPath, $package, $project)

function SetDependency($folder, $parent, $child)
{
    # Selections of items in the project are done with Where-Object rather than
    # direct access into the ProjectItems collection because if the object is
    # moved or doesn't exist then Where-Object will give us a null response rather
    # than the error that DTE will give us.

    # The parent will show with a sub-item if it's already got the dependency
    # set on the child. In the package upgrade scenario, you don't want to
    # reset all this, so skip it if it's set.

    $folderItem = $project.ProjectItems | Where-Object { $_.Name -eq $folder }

    if ($folderItem -eq $null)
    {
        # Folder not found - do nothing
        return
    }

    $parentItem = $folderItem.ProjectItems | Where-Object { $_.Name -eq $parent -and  $_.ProjectItems.Count -eq 0 }

    if ($parentItem -eq $null)
    {
        # Upgrade scenario - user has moved/removed the parent or it already has the sub-items set.
        return
    }

    $childItem = $folderItem.ProjectItems | Where-Object { $_.Name -eq $child }

    if ($childItem -eq $null)
    {
        # Upgrade scenario - user has moved/removed the child.
        return
    }

    # For client projects, need to set DependentUpon explicitly.

    Write-Host "Setting dependencies for" $parentItem.Name
    $childItem.Properties.Item("DependentUpon").Value = $parentItem.Name

    # Substitute project name within the parent document, since it is not
    # available when performing a source code transform on a client project.

    Write-Host "Updating model file for" $parentItem.Name
    $vsViewKindCode = "{7651A701-06E5-11D1-8EBD-00A0C90F26EA}"
    $view = $parentItem.Open($vsViewKindCode)
    $doc = $view.Document
    $doc.ReplaceText('$projectname$', $project.Name, 0)

    # Close the (invisible) XML view of the screen and save changes
    Write-Host "Saving changes to" $parentItem.Name
    $view.Close(1)
    Write-Host "Done"
}

# Determine if this project uses the 2.0 or 2.5 runtime (VS2012 not supported)

$two5 = $dte.Solution | Where-Object { $_.Kind -eq "{581633eb-b896-402f-8e60-36f3da191c85}" }

if ($two5 -ne $null)
{
    $newDefault = "default-2.5.0.htm";

    # Find the script type project in the current solution
    $client = $dte.Solution | Where-Object { $_.Kind -eq "{262852c6-cd72-467d-83fe-5eeb1973a190}" }
    if ($client -ne $null)
    {
        $scripts = $client.ProjectItems.Item("Scripts")
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
        }
    }
}
else
{
    $newDefault = "default-2.0.0.htm";
}

# Make a backup copy of default.htm

Write-Host "Backing up default.htm"
$default = $project.ProjectItems | Where-Object { $_.Name -eq "default.htm" }
$src = $default.Properties.Item("FullPath").Value
$dst = $src -replace "default.htm", "default-backup.htm"
Copy-Item $src $dst

# Temporarily remove default.htm from the project

$default.Remove()

# Overwrite default.htm with the appropriate version and re-add it to the project

$dst = $src -replace "default.htm", $newDefault
Copy-Item $dst $src
$project.ProjectItems.AddFromFile($src)

# Fix dependencies for the Reports screen

SetDependency "Screens" "Reports.lsml" "Reports.lsml.js"

# Display a message box with a warning to reload the solution

$msg = "Installation was successful, but you must save and reload the entire solution before you can use the updated project. Note that a backup copy of the original default.htm file was saved as default-backup.htm."
$title = "ActiveReports for LightSwitch HTML Client"
[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
[System.Windows.Forms.MessageBox]::Show($msg, $title)
