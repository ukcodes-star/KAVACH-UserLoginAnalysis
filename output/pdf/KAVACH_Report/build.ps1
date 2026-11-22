param([string]$Compiler = 'pdflatex')
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    if ($Compiler -eq 'tectonic') {
        & tectonic Final_Thesis.tex
        if ($LASTEXITCODE -ne 0) { throw 'Tectonic compilation failed.' }
    } else {
        foreach ($pass in 1..3) {
            & $Compiler -interaction=nonstopmode -halt-on-error Final_Thesis.tex
            if ($LASTEXITCODE -ne 0) { throw "LaTeX compilation failed on pass $pass." }
        }
    }
} finally { Pop-Location }
