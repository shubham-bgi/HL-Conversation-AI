import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class WebpageDTO {
  @ApiProperty({ example: 'https://en.wikipedia.org/wiki/Node.js' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: '' })
  @IsString()
  @IsOptional()
  pass: string;
}
