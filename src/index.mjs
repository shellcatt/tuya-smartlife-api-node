import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs'

const pkgJsonFilePath = '../package.json';
const _inlineRootPkg = new URL(pkgJsonFilePath, import.meta.url).pathname,
      _outputRootPkg = new URL(join('../', pkgJsonFilePath), import.meta.url).pathname;

const pkgJsonStr = (existsSync(_inlineRootPkg) ? 
    readFileSync(_inlineRootPkg, 'utf-8') :
    readFileSync(_outputRootPkg, 'utf-8')
);

const pkg = JSON.parse(pkgJsonStr);

export const version = pkg.version;
export const authStoreId = `${pkg.name}`;
export const sessionStoreId = `${pkg.name}_session`;
export const sessionStoreIdTest = `${pkg.name}_session_test`;

export * from './TuyaSmartLifeClient'





export const tuyaHA_asciiArt = `
                                 ↑↑↑↑↑↑↑          
                                      ↑↑↑↑        
                       ↑↑↑↑      ↑↑↑↑   ↑↑↑       
                    ↑↑↑↑↑↑↑↑↑↑      ↑↑↑  ↑↑       
                  ↑↑↑↑↑↑↑↑↑↑↑↑↑↑     ↑↑           
               ↑↑↑↑↑↑↑      ↑↑↑↑↑↑↑               
            ↑↑↑↑↑↑↑↑          ↑↑↑↑↑↑↑↑            
          ↑↑↑↑↑↑↑                ↑↑↑↑↑↑↑          
         ↑↑↑↑↑                      ↑↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑                        ↑↑↑↑         
         ↑↑↑↑↑                       ↑↑↑↑         
         ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑         
          ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑     
               _____                  
              |_   _|   _ _   _  __ _ 
                | || | | | | | |/ _\` |
                | || |_| | |_| | (_| |
                |_| \\__,_|\\__, |\\__,_|
                          |___/       

`;