import logger from "../Src/Utils/logger.js";
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zipUtils from './zipUtils.js';
import child_process from 'node:child_process';
async function compiler()
{
    logger.notify("Starting compiler...");

    await cleanup();

    const tempFolder = path.join(os.tmpdir(), 'mikaforge_temp');

    // create temp folder
    await createTempFolder(tempFolder);

    logger.notify("Zipping payload folder...");

    // copy source to temp folder
    const targetSrcFolder = path.join(tempFolder, 'Src');
    await fs.cp('./Src', targetSrcFolder, { recursive: true });


    // read main.js
    const main = await fs.readFile("./main.js", "utf-8");
    if(!main || main.length === 0) {
        logger.error("Failed to read main.js");
        return;
    }

    // zip payload folder
    const zipBuffer = await zipPayloadFolder(path.join(tempFolder, 'Src', 'Payload'));
    if(!zipBuffer) return;

    // write zip to main.js
    let modifiedMain = main.replace('const PayloadFolderBase64 = "";', `const PayloadFolderBase64 = "${zipBuffer.toString('base64')}";`);
    await fs.writeFile(path.join(tempFolder, 'main.js'), modifiedMain);
    logger.notify("Payload folder zipped successfully");

    logger.notify("Starting Bun Compiler...");

    // copy node_modules and package.json to temp folder
    await fs.cp('./node_modules', path.join(tempFolder, 'node_modules'), { recursive: true });
    await fs.cp('./package.json', path.join(tempFolder, 'package.json'));

    // compile with bun
    const child = child_process.spawn('bun', [
        'build', 'main.js', 
        '--compile', 
        '--minify',
        '--bundle',
        '--outfile', 
        'mikaforge.exe'], { cwd: tempFolder });
    child.stdout.on('data', (data) => {
        logger.notify(`BUN COMPILER: ${data.toString()}`);
    });
    child.stderr.on('data', (data) => {
        logger.error(data.toString());
    });
    child.on('close', async (code) => {
        if(code === 0) {
            logger.success("Build completed successfully");
            // copy mikaforge.exe current folder
            await fs.copyFile(path.join(tempFolder, 'mikaforge.exe'), path.join(__dirname, 'mikaforge.exe'));

            cleanup();
        }
        else {
            logger.error("Build failed");
            logger.error("Code: " + code);
            cleanup();
        }
    });

}

async function cleanup()
{
     // cleanup
    await fs.rm(path.join(os.tmpdir(), 'mikaforge_temp'), { recursive: true, force: true });
}

async function createTempFolder(folderPath) {
    await fs.mkdir(folderPath, { recursive: true });
}

async function zipPayloadFolder(folderPath) {
    try
    {
        const zipBuffer = await zipUtils.zipPayloadFolder(folderPath);
        return zipBuffer;
    }
    catch (error)
    {
        logger.error(`Failed to zip payload folder: ${error.message}`);
        return null;
    }
}


await compiler();

