import fs from 'node:fs/promises';
import path from 'node:path';

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
 * Finds a process by name and returns its PID.
 * If an error occurs while searching the processes, the function will return null.
 * @param {string} processName - The name of the process to search for.
 * @returns {number|null} The PID of the process, or null if not found.
 */
async function findProcessByName(processName) {
    try {
        const { spawn } = require('child_process');
        const ps = await new Promise((resolve, reject) => {
            const ps = spawn('powershell.exe', ['Get-Process', '-Name', processName, '|', 'Select-Object', 'Id']);
            let output = '';
            ps.stdout.on('data', data => {
                output += data.toString();
            });
            ps.on('close', () => {
                resolve(output.trim());
            });
            ps.on('error', error => {
                reject(error);
            });
        });

        // Parse the output to find the PID
        const pidRegex = /Id\s+:\s+(\d+)/;
        const match = ps.match(pidRegex);
        if (match) {
            const pid = parseInt(match[1], 10);
            return pid;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error finding process:', error);
        return null;
    }
}

export default {
    findCurseForge,
    findProcessByName
}