import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';


app.on('browser-window-created', (e, window) => {
    if (!window.isDestroyed() && !window.webContents.isDevToolsOpened()) {
       // window.webContents.openDevTools({ mode: 'detach' });
    }
});


/**
 * Loads the MikaForge engine from the index.js file in the app data directory.
 * If the file does not exist or is not accessible, the function will throw an error.
 * If the module cannot be imported, the function will also throw an error.
 * If an error occurs, the application will exit with code -1.
 * @throws {Error} If the file does not exist or is not accessible, or if the module cannot be imported.
 */
async function loadEngine() {
    const configPath = path.join(process.env.APPDATA, 'MikaForge', 'index.js');
    
    try {
        await fs.access(configPath); 
        const enginePath = pathToFileURL(configPath).href;
        
        await import(enginePath);
        
        console.log('Engine loaded successfully');
    } catch (error) {
        console.error('Failed to load module:', error);
        process.exit(-1);
    }
}


await loadEngine();


// ./app.asar/dist/background/background.js
import './app.asar/dist/background/background.js';
