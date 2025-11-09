import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

async function addFolderToZip(zip, folderPath, zipFolder) {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
            const subFolder = zipFolder.folder(entry.name);
            await addFolderToZip(zip, fullPath, subFolder);
        } else if (entry.isFile()) {
            const fileData = await fs.readFile(fullPath);
            zipFolder.file(entry.name, fileData);
        }
    }
}

async function zipPayloadFolder(payloadPath) {
    const zip = new JSZip();
    const rootFolder = zip.folder('Payload');
    await addFolderToZip(zip, payloadPath, rootFolder);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    return zipBuffer;
}

export default {
    zipPayloadFolder
}