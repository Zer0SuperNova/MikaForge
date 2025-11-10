import utils from './Src/Utils/utils.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import logger from './Src/Utils/logger.js';

async function main()
{
    const CurseForgePath = await utils.findCurseForge();

    // killing curseforge
    const CurseForgeProcess = await utils.findProcessByName("CurseForge");
    if (CurseForgeProcess) {
        try {
            process.kill(CurseForgeProcess.pid);
        } catch (error) {
            logger.error(`Failed to kill CurseForge process: ${error.message}`);
        }
    }
    
    // remove appdata folder
    await fs.rm(path.join(process.env.APPDATA, 'MikaForge'), { recursive: true, force: true });

    // unpatch asar file with backup
    logger.notify('Unpatching ASAR file...');

    const asarPath = path.join(CurseForgePath, 'resources/app.asar.backup');
    if (!await fs.access(asarPath).then(() => true).catch(() => false)) {
        logger.critical('ASAR backup file not found!');
    }

    // remove bridge
    await fs.rm(path.join(CurseForgePath, 'resources/_____MikaForgeBridge_____.js'), { force: true });

    // remove normal asar file
    await fs.rm(path.join(CurseForgePath, 'resources/app.asar'), { force: true });

    // rename app.asar.backup -> app.asar
    await fs.rename(asarPath, path.join(CurseForgePath, 'resources/app.asar'));

    logger.success('Unpatching complete!');
}

try
{
    await main();
}
catch (error)
{
    logger.error(error);
}