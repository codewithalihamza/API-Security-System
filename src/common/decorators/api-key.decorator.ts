import { SetMetadata } from '@nestjs/common';

export const API_KEY_REQUIRED_KEY = 'apiKeyRequired';

/**
 * Marks a route as requiring API key authentication (for internal/service-to-service)
 */
export const ApiKeyRequired = () => SetMetadata(API_KEY_REQUIRED_KEY, true);
