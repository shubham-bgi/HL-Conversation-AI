import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class WebpageDTO {
  @ApiProperty({ example: 'https://en.wikipedia.org/wiki/Node.js' })
  @IsUrl()
  url: string;

  //   @ApiPropertyOptional()
  //   @IsNumber()
  //   @IsOptional()
  //   pass: number;
}
