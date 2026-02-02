import { Octokit } from '@octokit/rest';

/**
 * Parameters for creating a pull request
 */
export interface CreatePRParams {
  title: string;
  body: string;
  head: string; // Branch name (feature branch)
  base: string; // Base branch (usually 'main' or 'master')
  draft?: boolean;
}

/**
 * Parameters for updating a pull request
 */
export interface UpdatePRParams {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  base?: string;
}

/**
 * Normalized pull request response
 */
export interface PR {
  number: number;
  url: string;
  title: string;
  body: string | null;
  head: string;
  base: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Normalized comment response
 */
export interface Comment {
  id: number;
  url: string;
  body: string;
  createdAt: string;
}

/**
 * GitHub API client with automatic rate limiting and retry logic
 */
export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 second

  constructor(token: string, owner: string, repo: string) {
    if (!token || token.trim() === '') {
      throw new Error('GitHub token is required');
    }
    if (!owner || owner.trim() === '') {
      throw new Error('Repository owner is required');
    }
    if (!repo || repo.trim() === '') {
      throw new Error('Repository name is required');
    }

    this.owner = owner;
    this.repo = repo;
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * Create a pull request
   */
  async createPR(params: CreatePRParams): Promise<PR> {
    return this.withRetry(async () => {
      const response = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: params.title,
        body: params.body,
        head: params.head,
        base: params.base,
        draft: params.draft,
      });

      return this.normalizePR(response.data);
    });
  }

  /**
   * Update a pull request
   */
  async updatePR(prNumber: number, params: UpdatePRParams): Promise<PR> {
    return this.withRetry(async () => {
      const response = await this.octokit.pulls.update({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        ...params,
      });

      return this.normalizePR(response.data);
    });
  }

  /**
   * Get a pull request
   */
  async getPR(prNumber: number): Promise<PR> {
    return this.withRetry(async () => {
      try {
        const response = await this.octokit.pulls.get({
          owner: this.owner,
          repo: this.repo,
          pull_number: prNumber,
        });

        return this.normalizePR(response.data);
      } catch (error: any) {
        if (error.status === 404) {
          throw new Error(`Pull request #${prNumber} not found`);
        }
        throw error;
      }
    });
  }

  /**
   * Add a comment to a pull request
   */
  async addPRComment(prNumber: number, body: string): Promise<Comment> {
    return this.withRetry(async () => {
      const response = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        body,
      });

      return {
        id: response.data.id,
        url: response.data.html_url,
        body: response.data.body || '',
        createdAt: response.data.created_at,
      };
    });
  }

  /**
   * Normalize GitHub API pull request response to consistent format
   */
  private normalizePR(data: any): PR {
    return {
      number: data.number,
      url: data.html_url,
      title: data.title,
      body: data.body,
      head: data.head.ref,
      base: data.base.ref,
      state: data.state,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Execute a function with retry logic for rate limiting and network errors
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Check if this is a rate limit error (429)
        if (error.status === 429) {
          const resetTime = error.response?.headers?.['x-ratelimit-reset'];
          if (resetTime) {
            const resetDate = new Date(parseInt(resetTime) * 1000);
            const waitTime = Math.max(0, resetDate.getTime() - Date.now());

            if (attempt < this.maxRetries) {
              await this.sleep(waitTime);
              continue;
            }
          }
        }

        // For other errors, use exponential backoff
        if (attempt < this.maxRetries) {
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          continue;
        }

        // If we've exhausted all retries, throw
        break;
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
