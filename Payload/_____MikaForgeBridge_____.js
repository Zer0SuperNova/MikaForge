import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';


app.on('browser-window-created', (e, window) => {
    if (!window.isDestroyed() && !window.webContents.isDevToolsOpened()) {
       // window.webContents.openDevTools({ mode: 'detach' });
    }
});


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
