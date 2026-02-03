/**
 * This module is responsible for patching the Fuses configuration in CurseForge.
 * 
 * The Fuses configuration is stored in a binary file, which we read and modify.
 * We use a custom map to convert the fuse state bytes into meaningful strings.
 * 
 * The FUSE_MAP object is used to map fuse state bytes to their corresponding string values.
 * 
 * The SENTINEL constant is used to mark the end of the Fuses configuration.
 * 
 * The patching process involves reading the Fuses configuration file, modifying the desired fuses, and writing the modified configuration back to the file.
 *
 * @module fusePatcher
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../Utils/logger.js';

const SENTINEL = 'dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX';

const FUSE_MAP = {
    0x30: "DISABLED",
    0x31: "ENABLED",
    0x72: "REMOVED",
    0x90: "INHERIT"
};

const FUSE_NAMES = [
    "runAsNode",
    "enableCookieEncryption",
    "enableNodeOptionsEnvironmentVariable",
    "enableNodeCliInspectArguments",
    "enableEmbeddedAsarIntegrityValidation",
    "onlyLoadAppFromAsar",
    "loadBrowserProcessSpecificV8Snapshot",
    "grantFileProtocolExtraPrivileges"
];

/**
 * Finds the position of the sentinel in the given buffer.
 * The sentinel is a hardcoded string inside the Fuses code.
 * @param {Buffer} buffer - The buffer to search for the sentinel in.
 * @returns {number} The position of the sentinel in the given buffer.
 * @throws {Error} If the sentinel is not found. This can happen if the Fuses code is modified or if the app is packed differently.
 */
function findSentinel(buffer) {
    const sentinelBuf = Buffer.from(SENTINEL, 'utf8');
    const offset = buffer.indexOf(sentinelBuf);

    if (offset === -1) {
        throw new Error("Sentinel not found. This app might not use Fuses or is packed differently.");
    }

    return offset;
}



/**
 * Prints the current configuration of the given Fuses buffer.
 * @param {Buffer} buffer - The buffer containing the Fuses configuration.
 * @param {number} fuseStart - The position of the Fuses configuration in the given buffer.
 * @returns {void} Nothing is returned.
 */
function getFuseConfiguration(buffer, fuseStart) {
    const version = buffer[fuseStart];
    const wireLength = buffer[fuseStart + 1];

    logger.success(`Fuse Version: ${version} | Total Fuses: ${wireLength}`);
    logger.notify("\n--- Current Configuration ---");

    for (let i = 0; i < wireLength; i++) {
        const stateByte = buffer[fuseStart + 2 + i];
        const stateName = FUSE_MAP[stateByte] || `UNKNOWN (0x${stateByte.toString(16)})`;
        const fuseName = FUSE_NAMES[i] || `UnknownFuse_${i}`;
        if (stateName === "ENABLED") {
            logger.err(`${i.toString().padStart(2)}: ${fuseName.padEnd(40)} -> ${stateName}`);
        }
        else
        {
            logger.success(`${i.toString().padStart(2)}: ${fuseName.padEnd(40)} -> ${stateName}`);
        }
        
        
    }
}

/**
 * Patches the given Fuses buffer by disabling the specified fuses.
 * 
 * The function takes the path to the executable file, the Fuses buffer, the position of the Fuses configuration in the buffer, and an array of indices of the fuses to patch.
 * If any of the specified fuses are enabled, the function overwrites the original file with a patched version and saves the original as a backup.
 * If no changes are needed, the function logs a message indicating that the security fuses are already disabled.
 * @param {string} exePath - The path to the executable file.
 * @param {Buffer} buffer - The buffer containing the Fuses configuration.
 * @param {number} fuseStart - The position of the Fuses configuration in the given buffer.
 * @param {Array<number>} targetIndices - An array of indices of the fuses to patch.
 * @returns {Promise<void>} Nothing is returned.
 */
async function patchSpecificFuses(exePath, buffer, fuseStart, targetIndices) {
    let needsWrite = false;

    targetIndices.forEach(index => {
        if (buffer[fuseStart + 2 + index] === 0x31) {
            buffer[fuseStart + 2 + index] = 0x30;
            logger.notify(`Patching ${FUSE_NAMES[index]} to DISABLED...`);
            needsWrite = true;
        }
    });

    if (needsWrite) {
        const backupPath = exePath + ".bak";
        await fs.copyFile(exePath, backupPath);
        await fs.writeFile(exePath, buffer);
        logger.success(`\n File patched. Original saved as ${path.basename(backupPath)}`);
    } else {
        logger.notify("- No changes needed. Security fuses are already disabled.");
    }
}

/**
 * Patches the given Electron executable file by disabling the specified fuses.
 * 
 * The function takes the path to the executable file, reads the file, finds the Fuses configuration, and disables the specified fuses.
 * If any of the specified fuses are enabled, the function overwrites the original file with a patched version and saves the original as a backup.
 * If no changes are needed, the function logs a message indicating that the security fuses are already disabled.
 * @param {string} electronExecutablePath - The path to the Electron executable file.
 * @returns {Promise<void>} Nothing is returned.
 */
async function patch(electronExecutablePath)
{

    try {
        logger.notify(`\n--- Scanning: ${path.basename(electronExecutablePath)} ---`);
        const buffer = await fs.readFile(electronExecutablePath);

        const offset = findSentinel(buffer);
        logger.success(`Found Sentinel at 0x${offset.toString(16)}`);


        const fuseStart = offset +  SENTINEL.length;

        getFuseConfiguration(buffer, fuseStart);
        console.log("\n");

        await patchSpecificFuses(electronExecutablePath, buffer, fuseStart, [4, 5]);

    } catch (error) {
        console.log(error);
    }
}


export default {
    patch
}