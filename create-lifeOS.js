#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_FILE = path.join(__dirname, 'taxonomy.txt');
const OUTPUT_DIR = path.join(__dirname, 'lifeOS');

/**
 * Parse a line and determine its indent level and content
 * @param {string} line - The line to parse
 * @returns {object|null} - { level, content } or null if empty line
 */
function parseLine(line) {
    if (!line.trim()) return null;
    
    // Count leading spaces (4 spaces = 1 level)
    const leadingSpaces = line.match(/^(\s*)/)[1].length;
    const level = Math.floor(leadingSpaces / 4);
    const content = line.trim();
    
    return { level, content };
}

/**
 * Build a tree structure from the parsed lines
 * @param {string[]} lines - Array of lines from the file
 * @returns {object[]} - Tree structure of folders
 */
function buildTree(lines) {
    const root = [];
    const stack = [{ level: -1, children: root }];
    
    for (const line of lines) {
        const parsed = parseLine(line);
        if (!parsed) continue;
        
        const { level, content } = parsed;
        const node = { name: content, children: [] };
        
        // Find the correct parent
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }
        
        // Add to parent's children
        stack[stack.length - 1].children.push(node);
        
        // Push this node onto the stack
        stack.push({ level, children: node.children });
    }
    
    return root;
}

/**
 * Create folders recursively from the tree structure
 * @param {object[]} nodes - Array of tree nodes
 * @param {string} parentPath - Parent directory path
 */
function createFolders(nodes, parentPath) {
    for (const node of nodes) {
        const folderPath = path.join(parentPath, node.name);
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Created: ${folderPath}`);
        } else {
            console.log(`Exists:  ${folderPath}`);
        }
        
        if (node.children && node.children.length > 0) {
            createFolders(node.children, folderPath);
        }
    }
}

/**
 * Main function
 */
function main() {
    console.log('=== Taxonomy Folder Creator ===\n');
    
    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Error: Input file not found: ${INPUT_FILE}`);
        process.exit(1);
    }
    
    // Read the file
    console.log(`Reading: ${INPUT_FILE}`);
    const content = fs.readFileSync(INPUT_FILE, 'utf-8');
    const lines = content.split('\n');
    
    console.log(`Found ${lines.length} lines\n`);
    
    // Build the tree structure
    const tree = buildTree(lines);
    
    // Create the output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}\n`);
    }
    
    // Create the folder structure
    console.log('Creating folder structure:\n');
    createFolders(tree, OUTPUT_DIR);
    
    console.log('\n=== Done! ===');
    console.log(`Folders created in: ${OUTPUT_DIR}`);
}

// Run the script
main();