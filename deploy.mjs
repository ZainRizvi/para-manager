import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config();

if (!process.env.OBSIDIAN_TEST_REPO) {
    console.error('OBSIDIAN_TEST_REPO is not set in .env file');
    process.exit(1);
}

const dest = path.join(process.env.OBSIDIAN_TEST_REPO, '.obsidian', 'plugins', 'para-manager');

try {
    // Build the project before deploying
    console.log('Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('Build completed.');
    
    // Check if destination directory exists
    if (!fs.existsSync(dest)) {
        console.error(`Destination directory does not exist: ${dest}`);
        console.log('Creating directory...');
        fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.copyFileSync('main.js', path.join(dest, 'main.js'));
    fs.copyFileSync('manifest.json', path.join(dest, 'manifest.json'));
    fs.copyFileSync('styles.css', path.join(dest, 'styles.css'));
    console.log('Files copied successfully to:', dest);
} catch (error) {
    console.error('Error during deployment:', error);
    process.exit(1);
}