import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import logger from './Handler/logger.js';

/**
 * Patches an ASAR file by replacing the main path with the bridge path
 * @param {string} asarPath - The path to the ASAR file to patch
 * @throws {Error} If the ASAR path is invalid or if the file is too large
 * @returns {Promise<Object>} An object containing information about the patching process
 */
async function patchAsar(asarPath) {
    if (!asarPath || typeof asarPath !== 'string' || !asarPath.endsWith('.asar')) {
        throw new Error('Invalid ASAR path provided');
    }

    const absolutePath = path.resolve(asarPath);
    
    try {
        await fs.access(absolutePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
        throw new Error(`ASAR file not accessible: ${error.message}`);
    }

    try {
        const stats = await fs.stat(absolutePath);
        const maxSize = 100 * 1024 * 1024; 
        
        if (stats.size > maxSize) {
            throw new Error(`File too large (${stats.size} bytes). Maximum: ${maxSize} bytes`);
        }

        const fileBuffer = await fs.readFile(absolutePath);
        
        const originalHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        logger.notify(`Original file hash: ${originalHash}`);

        //./dist/background/background.js
        //../_____MikaForgeBridge_____.js

        const searchBuffer = Buffer.from('"main": "./dist/background/background.js"');
        const replaceBuffer = Buffer.from(`"main": "../_____MikaForgeBridge_____.js"`);

        const index = fileBuffer.indexOf(searchBuffer);
        const replaceIndex = fileBuffer.indexOf(replaceBuffer);

        if (searchBuffer.length !== replaceBuffer.length) {
            throw new Error('Search and replace buffers have different sizes');
        }
        
        // check if already patched
        if (replaceIndex != -1) {
            throw new Error('already patched.');
        }

        // Create backup
        const backupPath = `${absolutePath}.backup`;
        try {
            await fs.copyFile(absolutePath, backupPath);
            logger.notify(`Backup created: ${backupPath}`);
        } catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
        }

        // Check if pattern exists
        if (index === -1) {
            throw new Error('Pattern not found in ASAR file');
        }

        logger.notify(`Pattern found at byte offset: ${index}`);

        const secondOccurrence = fileBuffer.indexOf(searchBuffer, index + 1);
        if (secondOccurrence !== -1) {
            logger.critical(`Warning: Multiple occurrences found. Only replacing first at offset ${index}`);
        }

        const patchedBuffer = Buffer.allocUnsafe(fileBuffer.length - searchBuffer.length + replaceBuffer.length);
        
        fileBuffer.copy(patchedBuffer, 0, 0, index);
        
        replaceBuffer.copy(patchedBuffer, index);
        
        fileBuffer.copy(patchedBuffer, index + replaceBuffer.length, index + searchBuffer.length);

        await fs.writeFile(absolutePath, patchedBuffer);

        const patchedHash = crypto.createHash('sha256').update(patchedBuffer).digest('hex');
        logger.notify(`Patched file hash: ${patchedHash}`);
        logger.success('ASAR patching completed successfully');

        return {
            success: true,
            originalHash,
            patchedHash,
            backupPath,
            bytesReplaced: searchBuffer.length,
            offsetReplaced: index,
        };

    } catch (error) {
        logger.critical(`Failed to patch file: ${error.message}`);
        return;
    }
}

export default {
    patchAsar
}