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

        // folder utils
        await createMikaForgeFolder('plugins'); // <- plugins folder
        await createMikaForgeFolder('themes');  // <- themes folder

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

/**
 * Finds the path of the CurseForge folder in the local programs directory.
 * If an error occurs while searching the directory, the function will return null.
 * @returns {string|null} The path of the CurseForge folder, or null if not found.
 */
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


/**
 * Copies the MikaForge bridge script to the destination path.
 * If the source file does not exist, permission is denied, or an error occurs while copying the file, the function will log an error.
 * @param {string} destinationPath - The path where the bridge script will be copied to.
 */
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

/**
 * Copies the MikaForge code from the Payload directory to the destination directory.
 * If permission is denied, or an error occurs while copying the file, the function will log an error.
 * @param {string} sourceDir - The path to the MikaForge code directory.
 * @param {string} destinationDir - The path where the MikaForge code will be copied to.
 */
async function saveMikaForgeCode() {
    const sourceDir = './Payload/MikaForge';
    const destinationDir = path.join(process.env.APPDATA, 'MikaForge');
    
    try {
        // copy MikaForge code (including core folder)
        await fs.cp(sourceDir, destinationDir, { 
            recursive: true,
            force: true 
        });
        
        logger.notify('MikaForge code copied successfully');
    } catch (error) {
        logger.error(`Failed to copy MikaForge directory: ${error.message}`);
    }
}
/**
 * Creates a folder in the MikaForge directory if it does not already exist.
 * If an error occurs while creating the folder, the function will log an error.
 * @param {string} folderName - The name of the folder to create.
 */

async function createMikaForgeFolder(folderName) {
    try {
        const folderPath = path.join(process.env.APPDATA, 'MikaForge', folderName);
        const exists = await fs.access(folderPath).then(() => true).catch(() => false);

        if (exists) {
            return;
        }

        await fs.mkdir(folderPath);
    } catch (error) {
        logger.error(`Failed to create ${folderName} folder: ${error.message}`);
    }
}

// load the engine
await main();