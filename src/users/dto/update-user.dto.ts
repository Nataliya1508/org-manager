import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'ID of the new boss', example: 8 })
  newBossId: number;
}
