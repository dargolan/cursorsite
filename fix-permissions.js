// Script to fix Strapi permissions
// Place this in the root of your strapi-backend directory and run with:
// node fix-permissions.js

const fs = require('fs');
const path = require('path');

// Check if .tmp directory exists (this is where Strapi stores permissions)
const tmpDir = path.join(__dirname, '.tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log('Created .tmp directory');
}

// Ensure the default roles directory exists
const rolesDir = path.join(tmpDir, 'data', 'roles');
if (!fs.existsSync(rolesDir)) {
  fs.mkdirSync(rolesDir, { recursive: true });
  console.log('Created roles directory');
}

// Public role permission template
const publicRolePermissions = {
  "actions": [
    // Content type permissions
    {
      "action": "api::tag.tag.find",
      "conditions": [],
      "fields": null,
      "properties": {},
      "role": "public",
      "subject": null
    },
    {
      "action": "api::tag.tag.findOne",
      "conditions": [],
      "fields": null,
      "properties": {},
      "role": "public",
      "subject": null
    },
    {
      "action": "api::track.track.find",
      "conditions": [],
      "fields": null,
      "properties": {},
      "role": "public",
      "subject": null
    },
    {
      "action": "api::track.track.findOne",
      "conditions": [],
      "fields": null,
      "properties": {},
      "role": "public",
      "subject": null
    }
  ]
};

// Write the permissions file
const publicRoleFile = path.join(rolesDir, 'public-role.json');
fs.writeFileSync(publicRoleFile, JSON.stringify(publicRolePermissions, null, 2));
console.log(`Public role permissions written to ${publicRoleFile}`);

console.log('Permissions file created. Now:');
console.log('1. Stop your Strapi server if it\'s running');
console.log('2. Start it again with: npm run develop');
console.log('3. Go to Strapi admin panel at http://localhost:1337/admin');
console.log('4. Navigate to Settings > USERS & PERMISSIONS PLUGIN > Roles');
console.log('5. Click on Public');
console.log('6. Ensure that Tag and Track have find and findOne permissions checked');
console.log('7. Save the changes'); 