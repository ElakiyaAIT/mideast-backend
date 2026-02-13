import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleName } from './enums/role-name.enum';

/**
 * RoleCacheService - Caches roleIds at application startup
 *
 * This service provides a convenient way to access roleIds without
 * repeatedly querying the database. Role names are only used here
 * during initialization, and the service exposes only roleIds.
 *
 * Usage in controllers/services:
 *
 * @example
 * constructor(private roleCacheService: RoleCacheService) {}
 *
 * @Roles(this.roleCacheService.adminRoleId)
 * @Get('admin-only')
 * adminRoute() {
 *   return { message: 'Admin only' };
 * }
 */
@Injectable()
export class RoleCacheService implements OnModuleInit {
  private readonly logger = new Logger(RoleCacheService.name);

  private _adminRoleId: string | null = null;
  private _sellerRoleId: string | null = null;
  private _buyerRoleId: string | null = null;

  constructor(private readonly roleService: RoleService) {}

  async onModuleInit(): Promise<void> {
    await this.loadRoleIds();
  }

  /**
   * Load roleIds from database at startup
   * This method is private and uses role names only for initialization
   */
  private async loadRoleIds(): Promise<void> {
    try {
      this.logger.log('Loading roleIds into cache...');

      const roles = await this.roleService.findAll();

      for (const role of roles) {
        switch (role.name) {
          case RoleName.ADMIN:
            this._adminRoleId = role._id.toString();
            break;
          case RoleName.SELLER:
            this._sellerRoleId = role._id.toString();
            break;
          case RoleName.BUYER:
            this._buyerRoleId = role._id.toString();
            break;
        }
      }

      if (this._adminRoleId && this._sellerRoleId && this._buyerRoleId) {
        this.logger.log('Role IDs cached successfully');
        this.logger.log(`Admin Role ID: ${this._adminRoleId}`);
        this.logger.log(`Seller Role ID: ${this._sellerRoleId}`);
        this.logger.log(`Buyer Role ID: ${this._buyerRoleId}`);
      } else {
        this.logger.warn(
          'One or more roles not found. Please ensure roles are seeded: npm run seed:roles',
        );
      }
    } catch (error) {
      this.logger.error('Failed to load roleIds:', error);
      throw error;
    }
  }

  /**
   * Get Admin roleId
   */
  get adminRoleId(): string {
    if (!this._adminRoleId) {
      throw new Error('Admin role not found. Please run: npm run seed:roles');
    }
    return this._adminRoleId;
  }

  /**
   * Get Seller roleId
   */
  get sellerRoleId(): string {
    if (!this._sellerRoleId) {
      throw new Error('Seller role not found. Please run: npm run seed:roles');
    }
    return this._sellerRoleId;
  }

  /**
   * Get Buyer roleId
   */
  get buyerRoleId(): string {
    if (!this._buyerRoleId) {
      throw new Error('Buyer role not found. Please run: npm run seed:roles');
    }
    return this._buyerRoleId;
  }

  /**
   * Check if a roleId is Admin
   */
  isAdmin(roleId: string): boolean {
    return roleId === this._adminRoleId;
  }

  /**
   * Check if a roleId is Seller
   */
  isSeller(roleId: string): boolean {
    return roleId === this._sellerRoleId;
  }

  /**
   * Check if a roleId is Buyer
   */
  isBuyer(roleId: string): boolean {
    return roleId === this._buyerRoleId;
  }

  /**
   * Reload roleIds from database
   * Call this after seeding roles or making role changes
   */
  async reload(): Promise<void> {
    await this.loadRoleIds();
  }
}
