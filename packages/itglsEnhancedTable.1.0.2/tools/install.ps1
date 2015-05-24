param($installPath, $toolsPath, $package, $project)

# References we are going to add
$cssReference = "`t<link rel=`"stylesheet`" type=`"text/css`" href=`"Content/itgLsEnhancedTable.css`" />"
$lodashReference = "`t<script type=`"text/javascript`" src=`"Scripts/lodash.min.js`"></script>"
$ehtReference = "`t<script type=`"text/javascript`" src=`"Scripts/itgLsEnhancedTable.js`"></script>"
$scriptEnd = "generated/generatedassets.js"
$headEnd = "</head>"


# Where is the user trying to Install our Nuget package
$projectRoot = split-path $project.FullName

# Where should our default.htm file be
$defaultHtmFilePath = $projectRoot + "\default.htm"

# Get the type of project, based on its extension
$projectExtension = [System.IO.Path]::GetExtension($project.FullName)

# If this is a LightSwitch Javascript project, lets go
if ($projectExtension -eq ".jsproj") {

	# Load our default.htm into memory
	$defaultHtm = {get-content $defaultHtmFilePath}.invoke()	
	
	$lineCounter = 0
	$cssInsertPoint = 0
	$scriptInsertPoint = 0
	$elementsToRemove = @()
	
	# Find any references
	foreach ($line in $defaultHtm) {
	
		$loweredLine = $line.ToLower()
		if ($loweredLine.Contains("itglsenhancedtable") -or $loweredLine.Contains("lodash")) {
			$elementsToRemove = $elementsToRemove + $line
		}
	}

	# Remove those references
	foreach ($line in $elementsToRemove) {
		$defaultHtm.Remove($line)
	}
	
	# Find our insert locations
	foreach ($line in $defaultHtm) {
	
		$loweredLine = $line.ToLower()
	
		# Find our head element, since it could be upper or lower
		if ($loweredLine.Contains($headEnd)) {$cssInsertPoint = $lineCounter-1}
		if ($loweredLine.Contains($scriptEnd)) {$scriptInsertPoint = $lineCounter+1}
		
		$lineCounter++
	}

	# Insert itgLsEnhancedTable.js first
	$defaultHtm.Insert($scriptInsertPoint, $ehtReference)
	
	# Insert lodash next, pushing down eht
	$defaultHtm.Insert($scriptInsertPoint, $lodashReference)
	
	# Insert our css as final
	$defaultHtm.Insert($cssInsertPoint, $cssReference)
			
	# Save new default.htm to old
	$defaultHtm | out-file -encoding ASCII $defaultHtmFilePath
	
} else {
	# Not a LightSwitch javascript project, so do nothing
}

