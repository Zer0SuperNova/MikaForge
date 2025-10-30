import patcher from './Core/patcher.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import logger from './Core/Handler/logger.js';

/**
 * Main entry point of the application.
 * This function patches the ASAR file and adds the bridge script to the MikaForge folder.
 * If an error occurs during the patching process, the application will exit with code 1.
 * @throws {Error} If the patching process fails
 */
async function main()
{
    try {
        const mikaForgePath = path.join(process.env.APPDATA, 'MikaForge');

        // check if MikaForge folder exists, if not create it
        if(!await fs.access(mikaForgePath).then(() => true).catch(() => false)) {
            await fs.mkdir(mikaForgePath);
        }

        const CurseForgePath = await findCurseForge();
        const CurseForgePathResource = path.join(CurseForgePath, 'resources');

        // patch the ASAR file
        const result = await patcher.patchAsar(CurseForgePathResource+'/app.asar');
        if(!result) {
            throw new Error('Failed to patch ASAR file');
        }

        // check if plugins folder exists, if not create it
        await createPluginsFolder();

        // add the bridge script to the MikaForge folder
        await addBridgeScript(CurseForgePathResource);

        // save a copy of mika to appdata
        await saveMikaForgeCode();

        logger.notify('Patching completed successfully!');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function findCurseForge() {
    const localProgramsPath = path.join(
        process.env.LOCALAPPDATA,
        'Programs'
    );

    try {
        // Read all items in the directory
        const items = await fs.readdir(localProgramsPath, { withFileTypes: true });
        
        // Find CurseForge folder
        const curseForgeItem = items.find(item => 
            item.isDirectory() && item.name.toLowerCase().includes('curseforge')
        );
        
        if (curseForgeItem) {
            const fullPath = path.join(localProgramsPath, curseForgeItem.name);
            return fullPath;
        } else {
            console.log('CurseForge not found');
            return null;
        }
    } catch (error) {
        console.error('Error searching directory:', error);
        return null;
    }
}


async function addBridgeScript(destinationPath) {
    const sourcePath = './Payload/_____MikaForgeBridge_____.js';
    const destinationFile = path.join(destinationPath, path.basename(sourcePath));

    try {
        await fs.access(sourcePath);
        
        await fs.copyFile(sourcePath, destinationFile);
        logger.notify('File copied successfully');
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.error(`File not found: ${error.path || sourcePath}`);
        } else if (error.code === 'EACCES') {
            logger.error(`Permission denied: ${error.message}`);
        } else {
            logger.error(`Failed to copy file: ${error.message}`);
        }
    }
}

async function saveMikaForgeCode() {
    const sourceDir = './Payload/Mikaforge';
    const destinationDir = path.join(process.env.APPDATA, 'MikaForge');
    
    try {
        // copy MikaForge code
        await fs.cp(sourceDir, destinationDir, { 
            recursive: true,
            force: true 
        });
        
        logger.notify('MikaForge code copied successfully');
    } catch (error) {
        logger.error(`Failed to copy MikaForge directory: ${error.message}`);
    }
}

async function createPluginsFolder()
{
    try
    {
        // check if folder already exists
        if(await fs.access(path.join(process.env.APPDATA, 'MikaForge', 'plugins')).then(() => true).catch(() => false)) {
            return;
        }

        // if not, create folder
        const pluginsPath = path.join(process.env.APPDATA, 'MikaForge', 'plugins');
        await fs.mkdir(pluginsPath);
    }
    catch (error)
    {
        logger.error(`Failed to create plugins folder: ${error.message}`);
    }
}



// load the engine
await main();