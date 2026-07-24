const fs = require('fs');
const path = require('path');

const moduleDir = path.join(__dirname, 'module');

const filesToMove = [
  // Admin
  { src: 'controllers/adminController.ts', dest: 'admin/admin.controller.ts' },
  { src: 'sevices/adminService.ts', dest: 'admin/admin.services.ts' },
  { src: 'routes/adminRoutes.ts', dest: 'admin/admin.route.ts' },
  // Parcel
  { src: 'controllers/parcelController.ts', dest: 'parcel/parcel.controller.ts' },
  { src: 'sevices/parcelServicecs.ts', dest: 'parcel/parcel.services.ts' }, // Note spelling: parcelServicecs.ts
  { src: 'routes/parcelRoutes.ts', dest: 'parcel/parcel.route.ts' },
  // Rider
  { src: 'controllers/riderController.ts', dest: 'rider/rider.controller.ts' },
  { src: 'sevices/riderService.ts', dest: 'rider/rider.services.ts' },
  { src: 'routes/riderRoutes.ts', dest: 'rider/rider.route.ts' },
  // Tracking
  { src: 'controllers/trackingController.ts', dest: 'tracking/tracking.controller.ts' },
  { src: 'sevices/trackingService.ts', dest: 'tracking/tracking.services.ts' },
  { src: 'routes/trackingRoutes.ts', dest: 'tracking/tracking.route.ts' },
  // User
  { src: 'controllers/userController.ts', dest: 'user/user.controller.ts' },
  { src: 'sevices/userService.ts', dest: 'user/user.services.ts' },
  { src: 'routes/userRoutes.ts', dest: 'user/user.route.ts' },
];

// Move files
filesToMove.forEach(({ src, dest }) => {
  const srcPath = path.join(moduleDir, src);
  const destPath = path.join(moduleDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${src} to ${dest}`);
  }
});

// Zod schemas extraction
const schemasFile = path.join(moduleDir, 'validation/zodSchemas.ts');
if (fs.existsSync(schemasFile)) {
  const schemasContent = fs.readFileSync(schemasFile, 'utf8');
  
  // Extract User schemas
  const userValidation = `import { z } from 'zod';\n\n` + 
    schemasContent.match(/export const userRegisterSchema =[\s\S]*?}\);/)[0] + '\n\n' +
    schemasContent.match(/export const userLoginSchema =[\s\S]*?}\);/)[0] + '\n';
  fs.writeFileSync(path.join(moduleDir, 'user/user.validation.ts'), userValidation);
  
  // Extract Parcel schemas
  const parcelValidation = `import { z } from 'zod';\n\n` + 
    schemasContent.match(/export const createParcelSchema =[\s\S]*?}\);/)[0] + '\n\n' +
    schemasContent.match(/export const updateParcelStatusSchema =[\s\S]*?}\);/)[0] + '\n';
  fs.writeFileSync(path.join(moduleDir, 'parcel/parcel.validation.ts'), parcelValidation);
  
  console.log('Extracted validation schemas');
}

// Function to update imports inside a file
function replaceImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace config paths: `../../config/db` -> `../../config/db` (still works for module/feature/file.ts)
  // Actually, from `module/feature/file.ts`, `../../config/db` is correct because `module` is 1 up, `server` is 2 up.
  // Previously `module/controllers/file.ts` had `../../config/db` so depth is the same. No change needed for `config`.
  
  // Controllers -> Services imports
  content = content.replace(/\.\.\/sevices\/(\w+)/g, (match, p1) => {
    if (p1 === 'adminService') return './admin.services';
    if (p1 === 'parcelServicecs') return './parcel.services';
    if (p1 === 'riderService') return './rider.services';
    if (p1 === 'trackingService') return './tracking.services';
    if (p1 === 'userService') return './user.services';
    return match;
  });

  // Routes -> Controllers imports
  content = content.replace(/\.\.\/controllers\/(\w+)/g, (match, p1) => {
    if (p1 === 'adminController') return './admin.controller';
    if (p1 === 'parcelController') return './parcel.controller';
    if (p1 === 'riderController') return './rider.controller';
    if (p1 === 'trackingController') return './tracking.controller';
    if (p1 === 'userController') return './user.controller';
    return match;
  });
  
  // Routes -> Validation imports
  content = content.replace(/\.\.\/validation\/zodSchemas/g, (match) => {
    if (filePath.includes('user.route')) return './user.validation';
    if (filePath.includes('parcel.route')) return './parcel.validation';
    return match;
  });
  
  // Routes -> Middleware imports
  // `../middleware/validateRequest` -> `../../module/middleware/validateRequest` or `../middleware/validateRequest`
  // From `module/parcel/parcel.route.ts` to `module/middleware/validateRequest.ts` it's `../middleware/validateRequest`
  content = content.replace(/\.\.\/middleware\//g, '../middleware/'); // Unchanged as depth is same

  // Export default router as named export for routes/index.ts
  content = content.replace(/export default router;/g, (match) => {
    if (filePath.includes('admin.route.ts')) return 'export const AdminRoutes = router;';
    if (filePath.includes('parcel.route.ts')) return 'export const ParcelRoutes = router;';
    if (filePath.includes('rider.route.ts')) return 'export const RiderRoutes = router;';
    if (filePath.includes('tracking.route.ts')) return 'export const TrackingRoutes = router;';
    if (filePath.includes('user.route.ts')) return 'export const UserRoutes = router;';
    return match;
  });
  
  fs.writeFileSync(filePath, content);
}

// Apply import replacements
const features = ['admin', 'parcel', 'rider', 'tracking', 'user'];
features.forEach(feature => {
  const files = fs.readdirSync(path.join(moduleDir, feature));
  files.forEach(file => {
    if (file.endsWith('.ts')) {
      replaceImports(path.join(moduleDir, feature, file));
    }
  });
});
console.log('Updated import paths');
