# Publishing Guide

This guide walks you through publishing `pptx-json-parser` to npm.

## 📋 Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **npm Login**: Run `npm login` in your terminal
3. **Package Name**: Ensure `pptx-json-parser` is available (or change it in package.json)

## 🚀 Publishing Steps

### 1. Prepare for Release

```bash
# Navigate to package directory
cd npm/packages/pptx-parser

# Install dependencies
pnpm install
```

### 2. Build the Package

```bash
# Type check
pnpm run type-check

# Build distribution files
pnpm run build
```

This will create:
- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ES Module build
- `dist/index.d.ts` - TypeScript declarations

### 3. Test the Build

```bash
# Check what will be published
npm pack --dry-run

# This shows all files that will be included
```

### 4. Update Version

```bash
# For patch release (1.0.0 -> 1.0.1)
npm version patch

# For minor release (1.0.0 -> 1.1.0)
npm version minor

# For major release (1.0.0 -> 2.0.0)
npm version major
```

### 5. Publish to npm

```bash
# First publish
pnpm publish --access public

# Subsequent publishes
pnpm publish
```

## 🔐 Organization Scope (Optional)

If you want to publish under an organization scope (e.g., `@yourorg/pptx-json-parser`):

1. **Create npm Organization**:
   - Go to npmjs.com
   - Create organization named `yourorg`

2. **Update package.json**:
   ```json
   {
     "name": "@yourorg/pptx-json-parser"
   }
   ```

3. **Grant Access**:
   ```bash
   npm access grant read-write yourorg:developers @yourorg/pptx-json-parser
   ```

## ✅ Post-Publication Checklist

- [ ] Verify package on npmjs.com
- [ ] Test installation: `npm install pptx-json-parser`
- [ ] Check documentation renders correctly
- [ ] Update CHANGELOG.md
- [ ] Announce release (if applicable)

## 🔄 Updating the Package

1. Make your changes
2. Update CHANGELOG.md
3. Bump version: `npm version patch/minor/major`
4. Build: `pnpm run build`
5. Publish: `pnpm publish`

## 🐛 Common Issues

### "You do not have permission to publish"

Solution: Make sure you're logged in:
```bash
npm login
npm whoami
```

### "Package name already exists"

Solution: Change the package name in `package.json` or use a scope:
```json
{
  "name": "@yourusername/pptx-parser"
}
```

### "Missing files in package"

Solution: Check `.npmignore` and `package.json` "files" field.

## 📦 Package Structure

```
dist/
  index.js          # CommonJS entry
  index.mjs         # ESM entry  
  index.d.ts        # TypeScript types
  [other files]     # Source maps, etc.

package.json        # Package metadata
README.md          # Documentation
LICENSE            # MIT License
CHANGELOG.md       # Version history
```

## 🔗 Useful Commands

```bash
# Check package info
npm view pptx-json-parser

# Check latest version
npm view pptx-json-parser version

# Check all versions
npm view pptx-json-parser versions

# Unpublish (within 72 hours)
npm unpublish pptx-json-parser@1.0.0

# Deprecate a version
npm deprecate pptx-json-parser@1.0.0 "Use version 1.0.1 instead"
```

## 📊 npm Statistics

After publishing, track your package:

- Downloads: https://www.npmjs.com/package/pptx-json-parser
- Bundle size: https://bundlephobia.com/package/pptx-json-parser
- Package health: https://snyk.io/advisor/npm-package/pptx-json-parser

## 🎯 Best Practices

1. **Semantic Versioning**: Follow semver strictly
2. **Changelog**: Keep CHANGELOG.md updated
3. **Testing**: Test thoroughly before publishing
4. **Documentation**: Keep README.md comprehensive
5. **Types**: Always include TypeScript definitions
6. **License**: Include LICENSE file
7. **Keywords**: Use relevant keywords in package.json

## 📝 Example Publish Workflow

```bash
# 1. Make changes
git checkout -b feature/new-feature

# 2. Commit changes
git add .
git commit -m "feat: add new feature"

# 3. Update version
npm version minor

# 4. Build
pnpm run build

# 5. Test
pnpm run type-check

# 6. Publish
pnpm publish

# 7. Done! Package is published
```

## 🆘 Support

If you encounter issues:
- Check npm status: https://status.npmjs.org/
- npm support: https://www.npmjs.com/support
- Documentation: https://docs.npmjs.com/

