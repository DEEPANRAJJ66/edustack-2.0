// ==============================================================================
// EDUSTACK 2.0 — TEST REGISTRY (CENTRAL CODE-MANAGED TESTS)
// ==============================================================================

import { TestRegistryItem } from '../types/test';
import { jeeMainMock01 } from './tests/jee-main-mock-01/test';
import { jeeMainMock02 } from './tests/jee-main-mock-02/test';

export const ALL_TESTS: TestRegistryItem[] = [
  jeeMainMock01,
  jeeMainMock02,
];

/**
 * Returns list of unique test folders/categories
 */
export function getTestFolders(): string[] {
  const folders = new Set(ALL_TESTS.map((t) => t.folder));
  return Array.from(folders);
}

/**
 * Retrieves a test by its unique ID
 */
export function getTestById(id: string): TestRegistryItem | undefined {
  return ALL_TESTS.find((t) => t.id === id);
}

/**
 * Retrieves tests belonging to a specific folder
 */
export function getTestsByFolder(folder: string): TestRegistryItem[] {
  return ALL_TESTS.filter((t) => t.folder === folder);
}
