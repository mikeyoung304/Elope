---
status: pending
priority: p2
issue_id: "066"
tags: [code-review, code-quality, dry, refactor]
dependencies: []
---

# Triple Method Duplication in UploadService

## Problem Statement

The UploadService has three nearly identical upload methods (`uploadLogo`, `uploadPackagePhoto`, `uploadSegmentImage`) that follow the exact same pattern: validate → generate filename → upload (real vs mock). This violates DRY principle and makes maintenance harder.

**Why This Matters:**
- 60+ lines of duplicated code
- Bug fixes need to be applied in 3 places
- Adding new upload types requires copy-paste
- DHH-style simplicity violation

## Findings

### Evidence from Code Review

**Current Duplication:**
```typescript
async uploadLogo(file: UploadedFile, tenantId: string): Promise<UploadResult> {
  this.validateFile(file);
  const filename = this.generateFilename(file.originalname, 'logo');
  if (this.isRealMode) return this.uploadToSupabase(tenantId, 'logos', filename, file);
  // filesystem logic...
}

async uploadPackagePhoto(file: UploadedFile, packageId: string, tenantId?: string): Promise<UploadResult> {
  this.validateFile(file, this.maxPackagePhotoSizeMB);
  const filename = this.generateFilename(file.originalname, 'package');
  if (this.isRealMode && tenantId) return this.uploadToSupabase(tenantId, 'packages', filename, file);
  // filesystem logic...
}

async uploadSegmentImage(file: UploadedFile, tenantId: string): Promise<UploadResult> {
  this.validateFile(file, this.maxPackagePhotoSizeMB);
  const filename = this.generateFilename(file.originalname, 'segment');
  if (this.isRealMode) return this.uploadToSupabase(tenantId, 'segments', filename, file);
  // filesystem logic...
}
```

### Code Simplicity Reviewer Assessment
- 95% identical code across 3 methods
- Only differences: directory path, size limit, filename prefix
- Could be one parameterized method

## Proposed Solutions

### Option A: Single Parameterized Upload Method (Recommended)

**Description:** One `upload()` method that accepts upload type as parameter.

**Pros:**
- Eliminates 60+ lines
- Single point of change
- Clear, simple API

**Cons:**
- Breaking change for callers
- Less explicit method names

**Effort:** Small (1-2 hours)
**Risk:** Low

```typescript
type UploadCategory = 'logos' | 'packages' | 'segments';

const SIZE_LIMITS: Record<UploadCategory, number> = {
  logos: 2,
  packages: 5,
  segments: 5,
};

async upload(
  file: UploadedFile,
  tenantId: string,
  category: UploadCategory
): Promise<UploadResult> {
  this.validateFile(file, SIZE_LIMITS[category]);
  const filename = this.generateFilename(file.originalname, category);

  if (this.isRealMode) {
    return this.uploadToSupabase(tenantId, category, filename, file);
  }

  const uploadDir = path.join(process.cwd(), 'uploads', category);
  fs.mkdirSync(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);

  return {
    url: `${this.baseUrl}/uploads/${category}/${filename}`,
    filename,
    size: file.size,
    mimetype: file.mimetype,
  };
}

// Thin wrappers for backwards compatibility (optional)
async uploadLogo(file: UploadedFile, tenantId: string) {
  return this.upload(file, tenantId, 'logos');
}
```

### Option B: Keep Wrappers, Extract Common Logic

**Description:** Keep public methods, extract shared logic to private method.

**Pros:**
- No breaking changes
- Preserves explicit API
- Still reduces duplication

**Cons:**
- More indirection
- Still 3 public methods to maintain

**Effort:** Small (1 hour)
**Risk:** Low

## Recommended Action

**Option A** for cleaner API, or **Option B** if backwards compatibility is critical.

## Technical Details

**Affected Files:**
- `server/src/services/upload.service.ts` - Consolidate methods
- `server/src/routes/tenant-admin.routes.ts` - Update calls if API changes
- `server/test/services/upload.service.test.ts` - Update tests

## Acceptance Criteria

- [ ] Single upload method handles all categories
- [ ] Size limits configurable per category
- [ ] Existing tests pass (or updated)
- [ ] No code duplication between upload paths

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-11-29 | Created | Found during code review - Code Simplicity Reviewer |

## Resources

- DRY Principle: https://en.wikipedia.org/wiki/Don%27t_repeat_yourself
