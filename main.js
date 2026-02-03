/**
 * Main module for MikaForge application.
 * 
 * This module is the main entry point of the application, handling
 * ASAR patching, payload extraction, and setting up the MikaForge folder.
 *
 * @module main
 */


import patcher from './Src/Core/patcher.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import logger from './Src/Utils/logger.js';
import JSZip from 'jszip';
import os from 'node:os';
import utils from './Src/Utils/utils.js';
import fusePatcher from './Src/Core/fusePatcher.js';

// this will only be used from the packer, DO NOT DELETE!
// START PAYLOAD
const PayloadFolderBase64 = "";
// END PAYLOAD

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

        const CurseForgePath = await utils.findCurseForge();
        const CurseForgePathResource = path.join(CurseForgePath, 'resources');

        // patch the integrity check
        const executablePath = path.join(CurseForgePath, 'CurseForge.exe');
        await fusePatcher.patch(executablePath);

        // patch the ASAR file
        const result = await patcher.patchAsar(CurseForgePathResource+'/app.asar');
        if(!result) {
            throw new Error('Failed to patch ASAR file');
        }

        // folder utils
        await createMikaForgeFolder('plugins'); // <- plugins folder
        await createMikaForgeFolder('themes');  // <- themes folder

        const isPacked = await isFilePacked();

        // extract MikaForge
        if(isPacked)
        {
            const buffer = Buffer.from(PayloadFolderBase64, 'base64');
            const extractedPath = await extractZipBufferToTemp(buffer);
            const bridgePath = path.join(path.join(extractedPath, 'Payload'), '_____MikaForgeBridge_____.js');
            const MikaPayloadPath = path.join(path.join(extractedPath, 'Payload'), 'MikaForge');

            await payloadExtraction(CurseForgePathResource, MikaPayloadPath, bridgePath);

            // delete temp folder
            await fs.rm(extractedPath, { recursive: true, force: true });
        }
        else
        {
            const bridgePathDev = './Src/Payload/_____MikaForgeBridge_____.js';
            const MikaPayloadPathDev = './Src/Payload/MikaForge';

            await payloadExtraction(CurseForgePathResource, MikaPayloadPathDev, bridgePathDev);
        }

        logger.notify('Patching completed successfully!');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function extractZipBufferToTemp(zipBuffer) {
    const zip = await JSZip.loadAsync(zipBuffer);

    const tempFolder = path.join(os.tmpdir(), 'mikaforge_payload_' + Date.now());
    await fs.mkdir(tempFolder, { recursive: true });

    await Promise.all(
        Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            const destPath = path.join(tempFolder, filename);

            if (file.dir) {
                await fs.mkdir(destPath, { recursive: true });
            } else {
                await fs.mkdir(path.dirname(destPath), { recursive: true });
                const content = await file.async('nodebuffer');
                await fs.writeFile(destPath, content);
            }
        })
    );

    return tempFolder
}

/**
 * Checks if the current executable is either `bun.exe` or `node.exe`.
 * This is used to determine if the application is running from the source code or if it has been packaged.
 * @returns {Promise<boolean>} A promise resolving to `true` if the executable is either `bun.exe` or `node.exe`, and `false` otherwise.
 */
async function isFilePacked() {
    const execFileName = path.basename(process.execPath).toLowerCase();
    return !(execFileName === 'bun.exe' || execFileName === 'node.exe');
}


/**
 * Extracts the MikaForge code from the payload and adds the bridge script to the CurseForge folder.
 * @param {string} CurseForgePathResource The path to the CurseForge resources folder.
 * @param {string} MikaPayloadPath The path to the MikaForge payload folder.
 * @param {string} bridgePath The path to the bridge script.
 */
async function payloadExtraction(CurseForgePathResource, MikaPayloadPath, bridgePath)
{
    // add the bridge script to the MikaForge folder
    await addBridgeScript(bridgePath, CurseForgePathResource);

    // save a copy of mika to appdata
    await saveMikaForgeCode(MikaPayloadPath);
}


/**
 * Copies the MikaForge bridge script to the destination path.
 * If the source file does not exist, permission is denied, or an error occurs while copying the file, the function will log an error.
 * @param {string} destinationPath - The path where the bridge script will be copied to.
 */
async function addBridgeScript(sourcePath ,destinationPath) {
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
 * Copies the MikaForge code from the source directory to the destination directory.
 * This function will overwrite any existing files in the destination directory.
 * If an error occurs while copying the directory, the function will log an error.
 * @param {string} sourceDir - The path of the source directory containing the MikaForge code.
 */
async function saveMikaForgeCode(sourceDir) {
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