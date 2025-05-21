import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class UpdateCourseDetailsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  learningObjectives: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  requirements: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  targetAudience: string[];
}
