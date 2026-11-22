import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const skill="C:/Users/acer/.codex/plugins/cache/openai-primary-runtime/presentations/26.1118.11504/skills/presentations";
const runtime="C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1118-904-0_26.1118.904.0_x64__3k8sg7r9htsxt/dependencies";
const build=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(build,'../..');
const detailedArchitecture=process.argv.includes('--architecture-deck');
const approvedOpening=detailedArchitecture||process.argv.includes('--approved-opening');
const aiHelpsDeck=approvedOpening||process.argv.includes('--ai-helps-deck');
const aiReportDeck=aiHelpsDeck||process.argv.includes('--ai-report-deck');
const grokDeck=aiReportDeck||process.argv.includes('--grok-deck');
const demoDeck=grokDeck||process.argv.includes('--demo-deck');
const mergedDeck=demoDeck||process.argv.includes('--merged-deck');
const finalDeck=process.argv.includes('--final-deck');
const riskUpdate=process.argv.includes('--risk-update');
const revision=process.argv.includes('--presentation');
const compact=process.argv.includes('--compact');
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const res=await finalizePresentation({
 workspaceDir:root,
 candidatePath:path.join(build,detailedArchitecture?'architecture-deck-candidate.pptx':approvedOpening?'approved-opening-candidate.pptx':aiReportDeck?'ai-report-deck-candidate.pptx':grokDeck?'grok-deck-candidate.pptx':demoDeck?'demo-deck-candidate.pptx':mergedDeck?'merged-deck-candidate.pptx':finalDeck?'final-deck-candidate.pptx':riskUpdate?'risk-update-candidate.pptx':revision?'presentation-candidate.pptx':compact?'compact-candidate.pptx':'candidate.pptx'),
 finalPath:path.join(root,'output/presentation',detailedArchitecture?'KAVACH_Presentation_Detailed_Architecture.pptx':approvedOpening?'KAVACH_Presentation_Revised_Opening.pptx':aiHelpsDeck?'KAVACH_Presentation_How_AI_Helps.pptx':aiReportDeck?'KAVACH_Presentation_With_AI_Report.pptx':grokDeck?'KAVACH_Presentation_With_Grok_Example.pptx':demoDeck?'KAVACH_Presentation_With_Dashboard.pptx':mergedDeck?'KAVACH_13_Slide_Presentation.pptx':finalDeck?'KAVACH_14_Slide_Presentation.pptx':riskUpdate?'KAVACH_Risk_Scoring_Presentation.pptx':revision?'KAVACH_12_Slide_Presentation.pptx':compact?'KAVACH_Condensed_Presentation.pptx':'KAVACH_Canva_Presentation.pptx'),
 pythonExecutable:path.join(runtime,'python/python.exe'),
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
 explicitTotalSlideCount:mergedDeck?13:finalDeck?14:riskUpdate?13:revision?12:compact?10:26,fontPolicy:{basis:'design',families:aiReportDeck?['Arial','Consolas']:['Arial']},
 verifyArtifactToolImport:true,receiptPath:path.join(build,detailedArchitecture?'architecture-deck-validation.json':approvedOpening?'approved-opening-validation.json':aiHelpsDeck?'ai-helps-deck-validation.json':aiReportDeck?'ai-report-deck-validation.json':grokDeck?'grok-deck-validation.json':demoDeck?'demo-deck-validation.json':mergedDeck?'merged-deck-validation.json':finalDeck?'final-deck-validation.json':riskUpdate?'risk-update-validation.json':revision?'presentation-validation.json':compact?'compact-validation.json':'validation.json')
});
console.log(JSON.stringify(res));
