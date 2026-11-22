# KAVACH MCA report

Main document: `Final_Thesis.tex`. Uses the supplied NIT Agartala class, logos, and chapter style, adapted for MCA.

Chapter 3 includes twelve detailed colored vector diagrams: C4 context/container/backend components; UML component architecture; login and AI sequences; entity relationships; UML use cases; DFD 0, DFD 1, and DFD 2 for detection and AI. Edit individual `.tex` files in `diagrams/`, shared colors in `Final_Thesis.tex`, and styles in `diagrams/styles.tex`. The existing overview, agent-flow, and navigation diagrams also use the color palette.

Confirmed details are stored in `metadata.tex`: Umakant Yadav (24MCA026), supervisor Dr. Ranjita Das (Assistant Professor), and HOD Dr. Ashim Saha (Associate Professor). The report title is "KAVACH: User Login Analysis Using LLM". Edit that file for future changes to these details or the submission date.

Build with `tectonic Final_Thesis.tex`, or run `pdflatex -interaction=nonstopmode -halt-on-error Final_Thesis.tex` three times. No BibTeX step is needed. Initial Tectonic builds require network access for packages; a complete TeX Live installation can compile offline.

The validation scenarios are proposed tests, not application test results. Screenshots and benchmarks were not invented. Add genuine application captures to Chapter 5 if required.

Original template class/style/logo files and README are retained. Files beginning `original_` are unmodified template examples, not part of the build. The sample bibliography is unused; references are embedded in the main document.
