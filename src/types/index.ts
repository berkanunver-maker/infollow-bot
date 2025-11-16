export interface InstagramUser {
  username: string;
  fullName: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  userId?: string;
}

export interface FollowingSnapshot {
  timestamp: number;
  date: string;
  targetUsername: string;
  followingCount: number;
  users: InstagramUser[];
}

export interface FollowChange {
  type: 'follow' | 'unfollow';
  user: InstagramUser;
  timestamp: number;
}

export interface DiffResult {
  newFollows: InstagramUser[];
  unfollows: InstagramUser[];
  unchanged: number;
  previousCount: number;
  currentCount: number;
  timestamp: number;
}

export interface ProxyConfig {
  enabled: boolean;
  server?: string;
  username?: string;
  password?: string;
}

export interface SecurityConfig {
  useStealthMode: boolean;
  useSessionPersistence: boolean;
  minDelay: number;
  maxDelay: number;
}

export interface BotConfig {
  instagram: {
    username: string;
    password: string;
    targetUsername: string;
  };
  twitter: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
  cron: {
    schedule: string;
  };
  paths: {
    dataDir: string;
    snapshotsDir: string;
    screenshotsDir: string;
    logDir: string;
  };
  browser: {
    headless: boolean;
    timeout: number;
  };
  logging: {
    level: string;
  };
  proxy: ProxyConfig;
  security: SecurityConfig;
}

export interface ScraperResult {
  success: boolean;
  snapshot?: FollowingSnapshot;
  error?: string;
}

export interface TwitterPostResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}
