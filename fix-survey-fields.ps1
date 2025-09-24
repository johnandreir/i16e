# Fix the field priority in Process Survey.json
$content = Get-Content "Process Survey.json" -Raw

# Fix the three occurrences where Owner field priority is wrong
# Replace the wrong order with the correct order
$content = $content -replace "survey\['Owner \(Case\)'\] \|\| survey\['Owner'\] \|\| survey\['Case Owner'\] \|\| survey\['Owner \(Case\) \(Case\)'\]", "survey['Owner (Case) (Case)'] || survey['Owner (Case)'] || survey['Owner'] || survey['Case Owner']"

# Write the corrected content back to the file
$content | Out-File "Process Survey.json" -Encoding UTF8

Write-Host "Fixed field priority in Process Survey.json"
Write-Host "✅ Changed 'Owner (Case)' to be checked AFTER 'Owner (Case) (Case)'"
Write-Host "✅ This should now match the correct person names instead of 'cseradm #'"