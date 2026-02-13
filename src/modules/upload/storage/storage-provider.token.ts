/**
 * Injection token for IStorageProvider
 * 
 * This token is used for dependency injection of storage providers.
 * We cannot use the IStorageProvider interface directly as a token because
 * TypeScript interfaces are erased at runtime and don't exist in JavaScript.
 * 
 * @example
 * // In a module:
 * providers: [
 *   {
 *     provide: STORAGE_PROVIDER_TOKEN,
 *     useFactory: async (factory: StorageProviderFactory) => {
 *       return await factory.createStorageProvider();
 *     },
 *     inject: [StorageProviderFactory],
 *   },
 * ]
 * 
 * // In a service:
 * constructor(
 *   @Inject(STORAGE_PROVIDER_TOKEN) private readonly storageProvider: IStorageProvider
 * ) {}
 */
export const STORAGE_PROVIDER_TOKEN = Symbol('STORAGE_PROVIDER');
