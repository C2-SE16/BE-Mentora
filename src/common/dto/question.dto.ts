import { question_type_enum } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionDto {
  @IsString()
  quizId: string;

  @IsString()
  questionText: string;

  @IsString()
  questionType: question_type_enum;

  @IsInt()
  orderIndex: number;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

export class AnswerDto {
  @IsString()
  answerText: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  quizId?: string;

  @IsOptional()
  @IsString()
  questionText?: string;

  @IsOptional()
  @IsString()
  questionType?: question_type_enum;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerUpdateDto)
  answers?: AnswerUpdateDto[];
}

export class AnswerUpdateDto extends AnswerDto {
  @IsOptional()
  @IsString()
  answerId?: string;
}
