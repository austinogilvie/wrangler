import {
  updatePRDescription,
  UpdatePRDescriptionParams,
} from '../scripts/update-pr-description';
import { GitHubClient } from '../scripts/utils/github';

// Mock GitHubClient
jest.mock('../scripts/utils/github');

describe('updatePRDescription', () => {
  let mockGitHubClient: jest.Mocked<GitHubClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGitHubClient = {
      getPRDescription: jest.fn(),
      updatePRDescription: jest.fn(),
    } as any;
    (GitHubClient as jest.Mock).mockImplementation(() => mockGitHubClient);
  });

  describe('basic update', () => {
    it('should update PR description with new content', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('# Existing content\n\n## Old section');
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '# Updated content\n\n## New section',
        mergeStrategy: 'replace',
      };

      await updatePRDescription(params);

      expect(mockGitHubClient.updatePRDescription).toHaveBeenCalledWith(
        123,
        '# Updated content\n\n## New section'
      );
    });

    it('should preserve existing content when merging', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue(
        '# Original\n\n## Section A\nContent A\n\n## Section B\nContent B'
      );
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '## Section A\nUpdated Content A',
        mergeStrategy: 'update-sections',
      };

      await updatePRDescription(params);

      expect(mockGitHubClient.updatePRDescription).toHaveBeenCalled();
      const updatedDescription = mockGitHubClient.updatePRDescription.mock.calls[0][1];
      expect(updatedDescription).toContain('Updated Content A');
      expect(updatedDescription).toContain('Section B');
      expect(updatedDescription).toContain('Content B');
    });
  });

  describe('merge strategies', () => {
    it('should support replace strategy', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('# Old content');
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '# New content',
        mergeStrategy: 'replace',
      };

      await updatePRDescription(params);

      expect(mockGitHubClient.updatePRDescription).toHaveBeenCalledWith(123, '# New content');
    });

    it('should support append strategy', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('# Existing content');
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '\n\n## Additional section',
        mergeStrategy: 'append',
      };

      await updatePRDescription(params);

      const updatedDescription = mockGitHubClient.updatePRDescription.mock.calls[0][1];
      expect(updatedDescription).toContain('Existing content');
      expect(updatedDescription).toContain('Additional section');
    });

    it('should support update-sections strategy (default)', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue(
        '## Planning\nOld plan\n\n## Execution\nOld execution'
      );
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '## Planning\nNew plan',
        mergeStrategy: 'update-sections',
      };

      await updatePRDescription(params);

      const updatedDescription = mockGitHubClient.updatePRDescription.mock.calls[0][1];
      expect(updatedDescription).toContain('New plan');
      expect(updatedDescription).toContain('Execution');
      expect(updatedDescription).toContain('Old execution');
    });
  });

  describe('section updates', () => {
    it('should update specific sections while preserving others', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue(
        '# Title\n\n## Planning\nPhase 1\n\n## Execution\nPhase 2\n\n## Verification\nPhase 3'
      );
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '## Execution\nUpdated Phase 2',
        mergeStrategy: 'update-sections',
      };

      await updatePRDescription(params);

      const updatedDescription = mockGitHubClient.updatePRDescription.mock.calls[0][1];
      expect(updatedDescription).toContain('Planning');
      expect(updatedDescription).toContain('Phase 1');
      expect(updatedDescription).toContain('Updated Phase 2');
      expect(updatedDescription).toContain('Verification');
      expect(updatedDescription).toContain('Phase 3');
    });

    it('should add new sections when not present', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('# Title\n\n## Planning\nPhase 1');
      mockGitHubClient.updatePRDescription.mockResolvedValue(undefined);

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '## Verification\nNew phase',
        mergeStrategy: 'update-sections',
      };

      await updatePRDescription(params);

      const updatedDescription = mockGitHubClient.updatePRDescription.mock.calls[0][1];
      expect(updatedDescription).toContain('Planning');
      expect(updatedDescription).toContain('Phase 1');
      expect(updatedDescription).toContain('Verification');
      expect(updatedDescription).toContain('New phase');
    });
  });

  describe('error handling', () => {
    it('should throw error if PR not found', async () => {
      mockGitHubClient.getPRDescription.mockRejectedValue(new Error('PR not found'));

      const params: UpdatePRDescriptionParams = {
        prNumber: 999,
        newDescription: 'New content',
      };

      await expect(updatePRDescription(params)).rejects.toThrow('PR not found');
    });

    it('should throw error if update fails', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('Old content');
      mockGitHubClient.updatePRDescription.mockRejectedValue(new Error('Update failed'));

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: 'New content',
      };

      await expect(updatePRDescription(params)).rejects.toThrow('Update failed');
    });

    it('should validate PR number', async () => {
      const params: UpdatePRDescriptionParams = {
        prNumber: -1,
        newDescription: 'New content',
      };

      await expect(updatePRDescription(params)).rejects.toThrow('Invalid PR number');
    });

    it('should validate new description', async () => {
      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '',
      };

      await expect(updatePRDescription(params)).rejects.toThrow('New description cannot be empty');
    });
  });

  describe('dry run mode', () => {
    it('should not update when dryRun is true', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('Old content');

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: 'New content',
        dryRun: true,
      };

      const result = await updatePRDescription(params);

      expect(mockGitHubClient.updatePRDescription).not.toHaveBeenCalled();
      expect(result).toContain('New content');
    });

    it('should return preview of changes in dry run', async () => {
      mockGitHubClient.getPRDescription.mockResolvedValue('## Planning\nOld');

      const params: UpdatePRDescriptionParams = {
        prNumber: 123,
        newDescription: '## Planning\nNew',
        mergeStrategy: 'update-sections',
        dryRun: true,
      };

      const result = await updatePRDescription(params);

      expect(result).toContain('New');
      expect(mockGitHubClient.updatePRDescription).not.toHaveBeenCalled();
    });
  });
});
