const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'module', 'controllers');

fs.readdirSync(controllersDir).forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix `const result = await` to `const result: any = await`
    content = content.replace(/const result = await/g, 'const result: any = await');
    
    // Fix req.params.id to req.params.id as string
    content = content.replace(/req\.params\.id/g, '(req.params.id as string)');
    
    // Fix req.query.email to req.query.email as string
    content = content.replace(/req\.query\.email/g, '(req.query.email as string)');

    fs.writeFileSync(filePath, content);
  }
});

// Also fix authMiddleware import for admin
const authMiddlewarePath = path.join(__dirname, 'module', 'middleware', 'authMiddleware.ts');
let authContent = fs.readFileSync(authMiddlewarePath, 'utf8');
authContent = authContent.replace(`import admin from '../../config/firebase';`, `import admin from '../../config/firebase';\nimport { getAuth } from 'firebase-admin/auth';`);
authContent = authContent.replace(`admin.auth().verifyIdToken(token)`, `getAuth().verifyIdToken(token)`);
fs.writeFileSync(authMiddlewarePath, authContent);

console.log('Fixes applied');
