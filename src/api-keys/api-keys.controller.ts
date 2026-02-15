import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    const { apiKey, id } = await this.apiKeysService.generate(
      user.id,
      createApiKeyDto.name,
    );
    return {
      id,
      apiKey,
      name: createApiKeyDto.name,
      warning: 'Store this key securely. It will not be shown again.',
    };
  }

  @Get()
  async list(@CurrentUser() user: User) {
    return this.apiKeysService.findByUser(user.id);
  }

  @Delete(':id')
  async revoke(@CurrentUser() user: User, @Param('id') id: string) {
    await this.apiKeysService.revoke(id, user.id);
    return { message: 'API key revoked successfully' };
  }
}
