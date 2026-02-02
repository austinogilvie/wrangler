import { GitHubClient, CreatePRParams, UpdatePRParams } from '../scripts/utils/github';

// Create mock functions
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockGet = jest.fn();
const mockCreateComment = jest.fn();

// Mock Octokit constructor
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      pulls: {
        create: mockCreate,
        update: mockUpdate,
        get: mockGet,
      },
      issues: {
        createComment: mockCreateComment,
      },
    })),
  };
});

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GitHubClient('fake-token', 'test-owner', 'test-repo');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid token and repo info', () => {
      expect(client).toBeInstanceOf(GitHubClient);
    });

    it('should throw error if token is empty', () => {
      expect(() => new GitHubClient('', 'owner', 'repo')).toThrow('GitHub token is required');
    });

    it('should throw error if owner is empty', () => {
      expect(() => new GitHubClient('token', '', 'repo')).toThrow('Repository owner is required');
    });

    it('should throw error if repo is empty', () => {
      expect(() => new GitHubClient('token', 'owner', '')).toThrow('Repository name is required');
    });
  });

  describe('createPR', () => {
    it('should create a pull request successfully', async () => {
      const mockPR = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/pull/123',
          title: 'Test PR',
          body: 'Test description',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          state: 'open',
          created_at: '2026-02-01T12:00:00Z',
          updated_at: '2026-02-01T12:00:00Z',
        },
      };

      mockCreate.mockResolvedValue(mockPR);

      const params: CreatePRParams = {
        title: 'Test PR',
        body: 'Test description',
        head: 'feature-branch',
        base: 'main',
      };

      const result = await client.createPR(params);

      expect(mockCreate).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test PR',
        body: 'Test description',
        head: 'feature-branch',
        base: 'main',
        draft: undefined,
      });

      expect(result).toEqual({
        number: 123,
        url: 'https://github.com/test-owner/test-repo/pull/123',
        title: 'Test PR',
        body: 'Test description',
        head: 'feature-branch',
        base: 'main',
        state: 'open',
        createdAt: '2026-02-01T12:00:00Z',
        updatedAt: '2026-02-01T12:00:00Z',
      });
    });

    it('should retry on rate limit error', async () => {
      const rateLimitError: any = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      rateLimitError.response = {
        headers: {
          'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 1),
        },
      };

      const mockPR = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/pull/123',
          title: 'Test PR',
          body: 'Test description',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          state: 'open',
          created_at: '2026-02-01T12:00:00Z',
          updated_at: '2026-02-01T12:00:00Z',
        },
      };

      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockPR);

      const params: CreatePRParams = {
        title: 'Test PR',
        body: 'Test description',
        head: 'feature-branch',
        base: 'main',
      };

      const result = await client.createPR(params);

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result.number).toBe(123);
    }, 10000);

    it('should retry on network error with exponential backoff', async () => {
      const networkError = new Error('Network timeout');
      const mockPR = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/pull/123',
          title: 'Test PR',
          body: 'Test description',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          state: 'open',
          created_at: '2026-02-01T12:00:00Z',
          updated_at: '2026-02-01T12:00:00Z',
        },
      };

      mockCreate
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockPR);

      const params: CreatePRParams = {
        title: 'Test PR',
        body: 'Test description',
        head: 'feature-branch',
        base: 'main',
      };

      const result = await client.createPR(params);

      expect(mockCreate).toHaveBeenCalledTimes(3);
      expect(result.number).toBe(123);
    }, 10000);

    it('should fail after max retries', async () => {
      const networkError = new Error('Network timeout');

      mockCreate.mockRejectedValue(networkError);

      const params: CreatePRParams = {
        title: 'Test PR',
        body: 'Test description',
        head: 'feature-branch',
        base: 'main',
      };

      await expect(client.createPR(params)).rejects.toThrow('Failed after 3 attempts: Network timeout');

      expect(mockCreate).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('updatePR', () => {
    it('should update a pull request successfully', async () => {
      const mockPR = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/pull/123',
          title: 'Updated PR',
          body: 'Updated description',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          state: 'open',
          created_at: '2026-02-01T12:00:00Z',
          updated_at: '2026-02-01T12:30:00Z',
        },
      };

      mockUpdate.mockResolvedValue(mockPR);

      const params: UpdatePRParams = {
        title: 'Updated PR',
        body: 'Updated description',
      };

      const result = await client.updatePR(123, params);

      expect(mockUpdate).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        pull_number: 123,
        title: 'Updated PR',
        body: 'Updated description',
      });

      expect(result.title).toBe('Updated PR');
      expect(result.body).toBe('Updated description');
    });

    it('should update only specified fields', async () => {
      const mockPR = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/pull/123',
          title: 'Original Title',
          body: 'Updated description',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          state: 'open',
          created_at: '2026-02-01T12:00:00Z',
          updated_at: '2026-02-01T12:30:00Z',
        },
      };

      mockUpdate.mockResolvedValue(mockPR);

      const params: UpdatePRParams = {
        body: 'Updated description',
      };

      const result = await client.updatePR(123, params);

      expect(mockUpdate).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        pull_number: 123,
        body: 'Updated description',
      });

      expect(result.body).toBe('Updated description');
    });
  });

  describe('getPR', () => {
    it('should get a pull request successfully', async () => {
      const mockPR = {
        data: {
          number: 123,
          html_url: 'https://github.com/test-owner/test-repo/pull/123',
          title: 'Test PR',
          body: 'Test description',
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
          state: 'open',
          created_at: '2026-02-01T12:00:00Z',
          updated_at: '2026-02-01T12:00:00Z',
        },
      };

      mockGet.mockResolvedValue(mockPR);

      const result = await client.getPR(123);

      expect(mockGet).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        pull_number: 123,
      });

      expect(result.number).toBe(123);
      expect(result.title).toBe('Test PR');
    });

    it('should throw error if PR not found', async () => {
      const notFoundError: any = new Error('Not Found');
      notFoundError.status = 404;

      mockGet.mockRejectedValue(notFoundError);

      await expect(client.getPR(999)).rejects.toThrow('Pull request #999 not found');
    });
  });

  describe('addPRComment', () => {
    it('should add a comment to a pull request successfully', async () => {
      const mockComment = {
        data: {
          id: 456,
          html_url: 'https://github.com/test-owner/test-repo/pull/123#issuecomment-456',
          body: 'Test comment',
          created_at: '2026-02-01T12:00:00Z',
        },
      };

      mockCreateComment.mockResolvedValue(mockComment);

      const result = await client.addPRComment(123, 'Test comment');

      expect(mockCreateComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123,
        body: 'Test comment',
      });

      expect(result).toEqual({
        id: 456,
        url: 'https://github.com/test-owner/test-repo/pull/123#issuecomment-456',
        body: 'Test comment',
        createdAt: '2026-02-01T12:00:00Z',
      });
    });
  });
});
