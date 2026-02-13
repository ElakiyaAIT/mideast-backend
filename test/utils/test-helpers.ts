import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

/**
 * Creates a NestJS testing module with the provided metadata
 * @param metadata - Module metadata configuration
 * @returns TestingModule instance
 */
export async function createTestingModule(metadata: ModuleMetadata): Promise<TestingModule> {
  return await Test.createTestingModule(metadata).compile();
}

/**
 * Creates a mock implementation of a class with all methods as jest.fn()
 * @param classToMock - The class to mock
 * @returns Mocked instance with jest functions
 */
export function createMockInstance<T extends object>(
  classToMock: new (...args: unknown[]) => T,
): jest.Mocked<T> {
  const mockInstance = {} as jest.Mocked<T>;
  const prototype = classToMock.prototype as object;

  Object.getOwnPropertyNames(prototype).forEach((name) => {
    if (name !== 'constructor') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      (mockInstance as any)[name] = jest.fn();
    }
  });

  return mockInstance;
}

/**
 * Creates a partial mock of a type with specified methods
 * @param methods - Object with method names and their mock implementations
 * @returns Partial mocked object
 */
export function createPartialMock<T>(
  methods: Partial<Record<keyof T, jest.Mock>>,
): jest.Mocked<Partial<T>> {
  return methods as jest.Mocked<Partial<T>>;
}

/**
 * Waits for all pending promises to resolve
 * Useful for testing async operations
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Creates a spy on console methods to suppress output during tests
 * @param methods - Array of console methods to spy on
 * @returns Object with restore function
 */
export function suppressConsole(
  methods: ('log' | 'warn' | 'error' | 'debug' | 'info')[] = ['log', 'warn', 'error'],
): { restore: () => void } {
  const spies: jest.SpyInstance[] = [];

  methods.forEach((method) => {
    spies.push(jest.spyOn(console, method).mockImplementation(() => undefined));
  });

  return {
    restore: (): void => {
      spies.forEach((spy) => spy.mockRestore());
    },
  };
}

/**
 * Type helper for extracting mock type from a class
 */
export type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};
