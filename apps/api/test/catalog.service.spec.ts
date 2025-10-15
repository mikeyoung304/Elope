/**
 * Unit tests for CatalogService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogService } from '../src/domains/catalog/service';
import { NotFoundError, ValidationError } from '../src/core/errors';
import { FakeCatalogRepository, buildPackage, buildAddOn } from './helpers/fakes';

describe('CatalogService', () => {
  let service: CatalogService;
  let catalogRepo: FakeCatalogRepository;

  beforeEach(() => {
    catalogRepo = new FakeCatalogRepository();
    service = new CatalogService(catalogRepo);
  });

  describe('getAllPackages', () => {
    it('returns all packages with their add-ons', async () => {
      // Arrange
      const pkg = buildPackage({ id: 'pkg_1', slug: 'basic' });
      const addOn = buildAddOn({ id: 'addon_1', packageId: 'pkg_1' });
      catalogRepo.addPackage(pkg);
      catalogRepo.addAddOn(addOn);

      // Act
      const result = await service.getAllPackages();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pkg_1');
      expect(result[0].addOns).toHaveLength(1);
      expect(result[0].addOns[0].id).toBe('addon_1');
    });
  });

  describe('getPackageBySlug', () => {
    it('returns package with add-ons when found', async () => {
      // Arrange
      const pkg = buildPackage({ id: 'pkg_1', slug: 'basic' });
      const addOn = buildAddOn({ id: 'addon_1', packageId: 'pkg_1' });
      catalogRepo.addPackage(pkg);
      catalogRepo.addAddOn(addOn);

      // Act
      const result = await service.getPackageBySlug('basic');

      // Assert
      expect(result.id).toBe('pkg_1');
      expect(result.slug).toBe('basic');
      expect(result.addOns).toHaveLength(1);
    });

    it('throws NotFoundError when package not found', async () => {
      // Act & Assert
      await expect(service.getPackageBySlug('nonexistent')).rejects.toThrow(NotFoundError);
      await expect(service.getPackageBySlug('nonexistent')).rejects.toThrow(
        'Package with slug "nonexistent" not found'
      );
    });
  });

  describe('createPackage', () => {
    it('creates a new package successfully', async () => {
      // Arrange
      const data = {
        slug: 'new-package',
        title: 'New Package',
        description: 'A brand new package',
        priceCents: 100000,
      };

      // Act
      const result = await service.createPackage(data);

      // Assert
      expect(result.slug).toBe('new-package');
      expect(result.title).toBe('New Package');
      expect(result.priceCents).toBe(100000);
      expect(result.id).toBeDefined();
    });

    it('throws ValidationError when slug is empty', async () => {
      // Arrange
      const data = {
        slug: '',
        title: 'New Package',
        description: 'A brand new package',
        priceCents: 100000,
      };

      // Act & Assert
      await expect(service.createPackage(data)).rejects.toThrow(ValidationError);
      await expect(service.createPackage(data)).rejects.toThrow(
        'slug, title, and description are required'
      );
    });

    it('throws ValidationError when price is negative', async () => {
      // Arrange
      const data = {
        slug: 'new-package',
        title: 'New Package',
        description: 'A brand new package',
        priceCents: -100,
      };

      // Act & Assert
      await expect(service.createPackage(data)).rejects.toThrow(ValidationError);
      await expect(service.createPackage(data)).rejects.toThrow(
        'priceCents must be non-negative'
      );
    });

    it('throws ValidationError when slug already exists', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ slug: 'existing' }));
      const data = {
        slug: 'existing',
        title: 'New Package',
        description: 'A brand new package',
        priceCents: 100000,
      };

      // Act & Assert
      await expect(service.createPackage(data)).rejects.toThrow(ValidationError);
      await expect(service.createPackage(data)).rejects.toThrow(
        'Package with slug "existing" already exists'
      );
    });
  });

  describe('updatePackage', () => {
    it('updates a package successfully', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1', slug: 'old-slug', title: 'Old Title' }));

      // Act
      const result = await service.updatePackage('pkg_1', {
        title: 'New Title',
        priceCents: 150000,
      });

      // Assert
      expect(result.id).toBe('pkg_1');
      expect(result.title).toBe('New Title');
      expect(result.priceCents).toBe(150000);
      expect(result.slug).toBe('old-slug'); // Unchanged
    });

    it('throws NotFoundError when package does not exist', async () => {
      // Act & Assert
      await expect(service.updatePackage('nonexistent', { title: 'New Title' })).rejects.toThrow(
        NotFoundError
      );
      await expect(service.updatePackage('nonexistent', { title: 'New Title' })).rejects.toThrow(
        'Package with id "nonexistent" not found'
      );
    });

    it('throws ValidationError when new price is negative', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));

      // Act & Assert
      await expect(service.updatePackage('pkg_1', { priceCents: -100 })).rejects.toThrow(
        ValidationError
      );
      await expect(service.updatePackage('pkg_1', { priceCents: -100 })).rejects.toThrow(
        'priceCents must be non-negative'
      );
    });

    it('throws ValidationError when new slug already exists', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1', slug: 'old-slug' }));
      catalogRepo.addPackage(buildPackage({ id: 'pkg_2', slug: 'existing-slug' }));

      // Act & Assert
      await expect(service.updatePackage('pkg_1', { slug: 'existing-slug' })).rejects.toThrow(
        ValidationError
      );
      await expect(service.updatePackage('pkg_1', { slug: 'existing-slug' })).rejects.toThrow(
        'Package with slug "existing-slug" already exists'
      );
    });

    it('allows updating slug to the same value', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1', slug: 'my-slug' }));

      // Act
      const result = await service.updatePackage('pkg_1', { slug: 'my-slug', title: 'Updated' });

      // Assert
      expect(result.slug).toBe('my-slug');
      expect(result.title).toBe('Updated');
    });
  });

  describe('deletePackage', () => {
    it('deletes a package successfully', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));

      // Act
      await service.deletePackage('pkg_1');

      // Assert
      const packages = await catalogRepo.getAllPackages();
      expect(packages).toHaveLength(0);
    });

    it('throws NotFoundError when package does not exist', async () => {
      // Act & Assert
      await expect(service.deletePackage('nonexistent')).rejects.toThrow(NotFoundError);
      await expect(service.deletePackage('nonexistent')).rejects.toThrow(
        'Package with id "nonexistent" not found'
      );
    });
  });

  describe('createAddOn', () => {
    it('creates a new add-on successfully', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));
      const data = {
        packageId: 'pkg_1',
        title: 'New Add-On',
        priceCents: 50000,
      };

      // Act
      const result = await service.createAddOn(data);

      // Assert
      expect(result.packageId).toBe('pkg_1');
      expect(result.title).toBe('New Add-On');
      expect(result.priceCents).toBe(50000);
      expect(result.id).toBeDefined();
    });

    it('throws ValidationError when packageId is empty', async () => {
      // Arrange
      const data = {
        packageId: '',
        title: 'New Add-On',
        priceCents: 50000,
      };

      // Act & Assert
      await expect(service.createAddOn(data)).rejects.toThrow(ValidationError);
      await expect(service.createAddOn(data)).rejects.toThrow(
        'packageId and title are required'
      );
    });

    it('throws ValidationError when price is negative', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));
      const data = {
        packageId: 'pkg_1',
        title: 'New Add-On',
        priceCents: -100,
      };

      // Act & Assert
      await expect(service.createAddOn(data)).rejects.toThrow(ValidationError);
      await expect(service.createAddOn(data)).rejects.toThrow(
        'priceCents must be non-negative'
      );
    });

    it('throws NotFoundError when package does not exist', async () => {
      // Arrange
      const data = {
        packageId: 'nonexistent',
        title: 'New Add-On',
        priceCents: 50000,
      };

      // Act & Assert
      await expect(service.createAddOn(data)).rejects.toThrow(NotFoundError);
      await expect(service.createAddOn(data)).rejects.toThrow(
        'Package with id "nonexistent" not found'
      );
    });
  });

  describe('updateAddOn', () => {
    it('updates an add-on successfully', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));
      catalogRepo.addAddOn(buildAddOn({ id: 'addon_1', packageId: 'pkg_1', title: 'Old Title' }));

      // Act
      const result = await service.updateAddOn('addon_1', {
        title: 'New Title',
        priceCents: 60000,
      });

      // Assert
      expect(result.id).toBe('addon_1');
      expect(result.title).toBe('New Title');
      expect(result.priceCents).toBe(60000);
    });

    it('throws ValidationError when new price is negative', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));
      catalogRepo.addAddOn(buildAddOn({ id: 'addon_1', packageId: 'pkg_1' }));

      // Act & Assert
      await expect(service.updateAddOn('addon_1', { priceCents: -100 })).rejects.toThrow(
        ValidationError
      );
      await expect(service.updateAddOn('addon_1', { priceCents: -100 })).rejects.toThrow(
        'priceCents must be non-negative'
      );
    });

    it('throws NotFoundError when moving to nonexistent package', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));
      catalogRepo.addAddOn(buildAddOn({ id: 'addon_1', packageId: 'pkg_1' }));

      // Act & Assert
      await expect(service.updateAddOn('addon_1', { packageId: 'nonexistent' })).rejects.toThrow(
        NotFoundError
      );
      await expect(service.updateAddOn('addon_1', { packageId: 'nonexistent' })).rejects.toThrow(
        'Package with id "nonexistent" not found'
      );
    });
  });

  describe('deleteAddOn', () => {
    it('deletes an add-on successfully', async () => {
      // Arrange
      catalogRepo.addPackage(buildPackage({ id: 'pkg_1' }));
      catalogRepo.addAddOn(buildAddOn({ id: 'addon_1', packageId: 'pkg_1' }));

      // Act
      await service.deleteAddOn('addon_1');

      // Assert
      const addOns = await catalogRepo.getAddOnsByPackageId('pkg_1');
      expect(addOns).toHaveLength(0);
    });
  });
});
