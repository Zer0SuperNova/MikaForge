import electron, { app, protocol } from 'electron'; 
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from './handler/logger.js';
import path from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let windowCount = 0;

app.on('browser-window-created', (e, window) => {
    windowCount++;
    const currentWindowNumber = windowCount;
    
    logger.notify(`[Loader] Window #${currentWindowNumber} created (ID: ${window.id})`);

    if (currentWindowNumber === 1) {
        // console.log(`[Loader] Skipping first window`);
        return;
    }

    window.webContents.once('dom-ready', async () => {
        try {
            logger.notify(`[Loader] Loading plugins for window #${currentWindowNumber}`);
            const pluginsPath = path.join(process.env.APPDATA, 'MikaForge', 'plugins');
            const files = readdirSync(pluginsPath);
            const plugins = files.filter(file => file.endsWith('.js'));
            
            for (const plugin of plugins) {
                const pluginPath = join(pluginsPath, plugin);
                const pluginCode = readFileSync(pluginPath, 'utf8');

                await window.webContents.executeJavaScript(pluginCode);
                logger.success(`[Loader] Loaded plugin: ${plugin}`);
            }
        } catch (error) {
            if (!error.message?.includes('destroyed')) {
                logger.error('[Loader] Failed to load plugins:'+ error);
            }
        }
    });
});

