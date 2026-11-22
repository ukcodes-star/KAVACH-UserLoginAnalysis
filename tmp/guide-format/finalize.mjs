import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const skill="C:/Users/acer/.codex/plugins/cache/openai-primary-runtime/presentations/26.1119.11507/skills/presentations";
const runtime="C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1119-907-0_26.1119.907.0_x64__3k8sg7r9htsxt/dependencies";
const base=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(base,'../..');
const scripts=path.join(skill,'container_tools');
const {finalizePresentation}=await import(pathToFileURL(path.join(scripts,'artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 workspaceDir:root,candidatePath:path.join(base,'guide-candidate.pptx'),
 finalPath:path.join(root,'output/presentation/KAVACH_Guide_Format_Simple_Introduction.pptx'),
 pythonExecutable:path.join(runtime,'python/python.exe'),
 integrityValidatorPath:path.join(scripts,'inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(scripts,'inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','9144000,6858000','--validate-heading-fit',
  '--require-native-table-slide','6','--require-native-table-slide','7'],
 explicitTotalSlideCount:13,requiredNativeTableOwnerSlides:[6,7],
 fontPolicy:{basis:'design',families:['Arial']},
 verifyArtifactToolImport:true,receiptPath:path.join(base,'guide-simple-introduction-validation.json')
});
console.log(JSON.stringify({finalPath:result.finalPath,slides:result.packageIntegrity.slide_count,layout:result.presentationLayout.finding_count,editable:result.firstPartyImport.passed}));
