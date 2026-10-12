// Test-only in-process TS loader; no generated application files or packages.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
registerHooks({
  resolve(specifier,context,next) {
    const base=specifier.startsWith('@/')?resolve(process.cwd(),specifier.slice(2)):specifier.startsWith('.')&&context.parentURL?.startsWith('file:')?resolve(dirname(fileURLToPath(context.parentURL)),specifier):null;
    if(base)for(const suffix of ['','.ts','/index.ts'])if(existsSync(base+suffix)&&!base.endsWith('/')) {try{return next(pathToFileURL(base+suffix).href,context);}catch{}}
    return next(specifier,context);
  },
  load(url,context,next) {
    if(url.startsWith('file:')&&url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};
    return next(url,context);
  },
});
