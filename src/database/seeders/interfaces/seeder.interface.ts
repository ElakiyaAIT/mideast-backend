/**
 * Interface for database seeders
 * All seeders must implement this interface to ensure consistency
 */
export interface ISeeder {
  /**
   * Seeds the database with initial data
   * Should be idempotent - running multiple times should not create duplicates
   */
  seed(): Promise<void>;

  /**
   * Optional: Gets the name of the seeder for logging purposes
   */
  getName(): string;
}
