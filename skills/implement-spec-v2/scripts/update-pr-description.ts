import { GitHubClient } from './utils/github';

/**
 * Merge strategy for updating PR description
 */
export type MergeStrategy = 'replace' | 'append' | 'update-sections';

/**
 * Parameters for updating PR description
 */
export interface UpdatePRDescriptionParams {
  prNumber: number;
  newDescription: string;
  mergeStrategy?: MergeStrategy;
  dryRun?: boolean;
}

/**
 * Update PR description on GitHub
 *
 * Supports multiple merge strategies:
 * - replace: Replace entire description
 * - append: Append new content to existing description
 * - update-sections: Update specific sections while preserving others
 *
 * @param params - Update parameters
 * @returns Updated description (or preview if dryRun is true)
 */
export async function updatePRDescription(params: UpdatePRDescriptionParams): Promise<string> {
  const { prNumber, newDescription, mergeStrategy = 'update-sections', dryRun = false } = params;

  // Validate parameters
  if (prNumber <= 0) {
    throw new Error('Invalid PR number');
  }

  if (!newDescription || newDescription.trim() === '') {
    throw new Error('New description cannot be empty');
  }

  // Initialize GitHub client
  const client = new GitHubClient();

  // Get existing PR description
  const existingDescription = await client.getPRDescription(prNumber);

  // Merge descriptions based on strategy
  let updatedDescription: string;

  switch (mergeStrategy) {
    case 'replace':
      updatedDescription = newDescription;
      break;

    case 'append':
      updatedDescription = existingDescription + '\n\n' + newDescription;
      break;

    case 'update-sections':
      updatedDescription = mergeSections(existingDescription, newDescription);
      break;

    default:
      throw new Error(`Unknown merge strategy: ${mergeStrategy}`);
  }

  // If dry run, return preview without updating
  if (dryRun) {
    return updatedDescription;
  }

  // Update PR description on GitHub
  await client.updatePRDescription(prNumber, updatedDescription);

  return updatedDescription;
}

/**
 * Merge sections from new description into existing description
 *
 * Sections are identified by markdown headers (## Section Name)
 * - Updates existing sections with new content
 * - Adds new sections that don't exist
 * - Preserves existing sections not mentioned in new description
 */
function mergeSections(existing: string, newContent: string): string {
  const existingSections = parseMarkdownSections(existing);
  const newSections = parseMarkdownSections(newContent);

  // Merge: Update existing sections or add new ones
  for (const [sectionName, sectionContent] of Object.entries(newSections)) {
    existingSections[sectionName] = sectionContent;
  }

  // Reconstruct markdown from sections
  return reconstructMarkdown(existingSections);
}

/**
 * Parse markdown into sections
 *
 * Returns map of section name to content (including the header)
 */
function parseMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split('\n');

  let currentSection: string | null = null;
  let currentLines: string[] = [];
  let preambleLines: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections[currentSection] = currentLines.join('\n');
      } else if (preambleLines.length > 0) {
        sections['__preamble__'] = preambleLines.join('\n');
      }

      // Start new section
      currentSection = headerMatch[1];
      currentLines = [line];
    } else {
      if (currentSection) {
        currentLines.push(line);
      } else {
        preambleLines.push(line);
      }
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentLines.join('\n');
  } else if (preambleLines.length > 0) {
    sections['__preamble__'] = preambleLines.join('\n');
  }

  return sections;
}

/**
 * Reconstruct markdown from sections map
 */
function reconstructMarkdown(sections: Record<string, string>): string {
  const parts: string[] = [];

  // Add preamble first (if exists)
  if (sections['__preamble__']) {
    parts.push(sections['__preamble__']);
    delete sections['__preamble__'];
  }

  // Add all other sections
  for (const sectionContent of Object.values(sections)) {
    parts.push(sectionContent);
  }

  return parts.join('\n\n').trim();
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const prNumber = parseInt(process.argv[2], 10);
  const newDescriptionPath = process.argv[3];
  const mergeStrategy = (process.argv[4] as MergeStrategy) || 'update-sections';
  const dryRun = process.argv[5] === '--dry-run';

  if (!prNumber || !newDescriptionPath) {
    console.error(
      'Usage: ts-node update-pr-description.ts <prNumber> <newDescriptionPath> [mergeStrategy] [--dry-run]'
    );
    process.exit(1);
  }

  import('fs/promises')
    .then((fs) => fs.readFile(newDescriptionPath, 'utf-8'))
    .then((newDescription) =>
      updatePRDescription({
        prNumber,
        newDescription,
        mergeStrategy,
        dryRun,
      })
    )
    .then((result) => {
      if (dryRun) {
        console.log('=== DRY RUN - Preview of updated description ===');
        console.log(result);
      } else {
        console.log('PR description updated successfully');
      }
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
