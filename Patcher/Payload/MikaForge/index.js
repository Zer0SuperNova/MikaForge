import electron, { app, protocol, ipcMain } from 'electron'; 
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from './handler/logger.js';
import path from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let windowCount = 0;
const windowMap = new Map(); 

/**
 * Loads all theme files for the given window and stores them in the window object.
 * @param {Electron.BrowserWindow} window - The window to load the themes for
 * @returns {Promise<Object>} - An object containing the list of theme files and their contents
 */
async function loadThemesForWindow(window) {
    const themesPath = path.join(process.env.APPDATA, 'MikaForge', 'themes');
    let themes = [];
    const themeData = {};
    
    try {
        const themeFiles = readdirSync(themesPath);
        themes = themeFiles.filter(file => file.endsWith('.css'));
        
        // Read theme file contents
        for (const theme of themes) {
            const themePath = join(themesPath, theme);
            try {
                themeData[theme] = readFileSync(themePath, 'utf8');
            } catch (readError) {
                logger.error(`[Loader] Failed to read theme ${theme}: ${readError}`);
            }
        }
        
        // Store theme files and data in window for the themes menu
        await window.webContents.executeJavaScript(`
            window.__mikaForgeThemeFiles = ${JSON.stringify(themes)};
            window.__mikaForgeThemeData = ${JSON.stringify(themeData)};
        `);
        
        if (themes.length > 0) {
            logger.success(`[Loader] Loaded ${themes.length} theme(s)`);
        }
        
        return { themes, themeData };
    } catch (dirError) {
        // Themes folder might not exist, that's okay
        if (!dirError.message?.includes('ENOENT')) {
            logger.error('[Loader] Failed to read themes folder: ' + dirError);
        }
        await window.webContents.executeJavaScript(`
            window.__mikaForgeThemeFiles = [];
            window.__mikaForgeThemeData = {};
        `);
        return { themes: [], themeData: {} };
    }
}

app.on('browser-window-created', (e, window) => {
    windowCount++;
    const currentWindowNumber = windowCount;
    
    logger.notify(`[Loader] Window #${currentWindowNumber} created (ID: ${window.id})`);

    if (currentWindowNumber === 1) {
        // console.log(`[Loader] Skipping first window`);
        return;
    }
    
    // Store window reference
    windowMap.set(window.id, window);
    
    // Expose refresh function, app data path, and IPC to renderer
    window.webContents.once('did-finish-load', async () => {
        await window.webContents.executeJavaScript(`
            window.__mikaForgeAppData = ${JSON.stringify(process.env.APPDATA)};
            
            // Expose IPC renderer
            if (typeof require !== 'undefined') {
                try {
                    const { ipcRenderer } = require('electron');
                    window.__mikaForgeIpcRenderer = ipcRenderer;
                } catch (e) {
                    console.error('[MikaForge] Failed to get ipcRenderer:', e);
                }
            }
            
            window.__mikaForgeRefreshThemes = async function() {
                // Request refresh from main process via IPC
                if (window.__mikaForgeIpcRenderer) {
                    await window.__mikaForgeIpcRenderer.invoke('refresh-themes');
                    // Wait for themes to be refreshed
                    return new Promise((resolve) => {
                        window.addEventListener('__mikaForgeThemesRefreshed', () => {
                            resolve();
                        }, { once: true });
                    });
                }
            };
        `);
    });

    window.webContents.once('dom-ready', async () => {
        try {
            // Expose IPC early so plugin API can use it
            await window.webContents.executeJavaScript(`
                if (typeof require !== 'undefined' && !window.__mikaForgeIpcRenderer) {
                    try {
                        const { ipcRenderer } = require('electron');
                        window.__mikaForgeIpcRenderer = ipcRenderer;
                    } catch (e) {
                        console.error('[MikaForge] Failed to get ipcRenderer:', e);
                    }
                }
            `);
            
            // Load core plugins first (built-in functionality)
            const corePluginsPath = join(__dirname, 'core');
            
            try {
                const coreFiles = readdirSync(corePluginsPath);
                const corePlugins = coreFiles.filter(file => file.endsWith('.js'));
                
                // Load plugin-api.js first
                const apiPlugin = corePlugins.find(f => f === 'plugin-api.js');
                if (apiPlugin) {
                    const apiPluginPath = join(corePluginsPath, apiPlugin);
                    const apiPluginCode = readFileSync(apiPluginPath, 'utf8');
                    await window.webContents.executeJavaScript(apiPluginCode);
                    logger.success(`[Loader] Loaded core plugin: ${apiPlugin}`);
                }
                
                // Load other core plugins
                for (const corePlugin of corePlugins) {
                    if (corePlugin === 'plugin-api.js') continue; // Already loaded
                    const corePluginPath = join(corePluginsPath, corePlugin);
                    const corePluginCode = readFileSync(corePluginPath, 'utf8');
                    
                    await window.webContents.executeJavaScript(corePluginCode);
                    logger.success(`[Loader] Loaded core plugin: ${corePlugin}`);
                }
            } catch (coreError) {
                // Core folder might not exist yet, that's okay
                if (!coreError.message?.includes('ENOENT')) {
                    logger.error('[Loader] Failed to load core plugins: ' + coreError);
                }
            }
            
            // Then load user plugins
            logger.notify(`[Loader] Loading plugins for window #${currentWindowNumber}`);
            const pluginsPath = path.join(process.env.APPDATA, 'MikaForge', 'plugins');
            
            // Store list of plugin files that exist in the folder
            let plugins = [];
            try {
                const files = readdirSync(pluginsPath);
                plugins = files.filter(file => file.endsWith('.js'));
                // Store the list of plugin files in window for the plugins menu
                await window.webContents.executeJavaScript(`
                    window.__mikaForgePluginFiles = ${JSON.stringify(plugins)};
                `);
            } catch (dirError) {
                // Plugins folder might not exist, that's okay
                if (!dirError.message?.includes('ENOENT')) {
                    logger.error('[Loader] Failed to read plugins folder: ' + dirError);
                }
                await window.webContents.executeJavaScript(`window.__mikaForgePluginFiles = [];`);
            }
            
            for (const plugin of plugins) {
                const pluginPath = join(pluginsPath, plugin);
                const pluginCode = readFileSync(pluginPath, 'utf8');

                await window.webContents.executeJavaScript(pluginCode);
                logger.success(`[Loader] Loaded plugin: ${plugin}`);
            }
            
            // Load themes
            await loadThemesForWindow(window);
            
            // Trigger window open event for Plugin API
            await window.webContents.executeJavaScript(`
                if (window.MikaForge && window.MikaForge._triggerWindowOpen) {
                    window.MikaForge._triggerWindowOpen();
                }
            `);
        } catch (error) {
            if (!error.message?.includes('destroyed')) {
                logger.error('[Loader] Failed to load plugins:'+ error);
            }
        }
    });
});

// Set up IPC handler for theme refresh
ipcMain.handle('refresh-themes', async (event) => {
    const webContents = event.sender;
    // Find the window that matches this webContents
    const windowEntry = Array.from(windowMap.entries()).find(([id, w]) => w.webContents === webContents);
    
    if (windowEntry) {
        const [, window] = windowEntry;
        if (window && !window.isDestroyed()) {
            logger.notify('[Loader] Refreshing themes...');
            await loadThemesForWindow(window);
            // Notify renderer that themes have been refreshed
            await window.webContents.executeJavaScript(`
                window.dispatchEvent(new CustomEvent('__mikaForgeThemesRefreshed'));
            `);
            return { success: true };
        }
    }
    return { success: false };
});

