import { BadRequestException } from '@nestjs/common';

export interface BookInput {
  categoryId: number;
  title: string;
  author: string;
  description: string;
  recommendation: string;
}

export function validateBookInput(value: unknown): BookInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException({ message: '책 정보를 올바른 형식으로 보내 주세요.' });
  }
  const source = value as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const text = (key: string, objectLabel: string, subjectLabel: string, max: number, required: boolean): string => {
    const raw = source[key];
    if (raw === undefined && !required) return '';
    if (typeof raw !== 'string') {
      fieldErrors[key] = required && raw === undefined ? `${objectLabel} 입력해 주세요.` : `${subjectLabel} 글자로 입력해 주세요.`;
      return '';
    }
    const trimmed = raw.trim();
    if (required && !trimmed) fieldErrors[key] = `${objectLabel} 입력해 주세요.`;
    else if (trimmed.length > max) fieldErrors[key] = `${subjectLabel} ${max}자 이내로 입력해 주세요.`;
    return trimmed;
  };
  const title = text('title', '책 제목을', '책 제목은', 120, true);
  const author = text('author', '저자를', '저자는', 120, true);
  const recommendation = text('recommendation', '추천 이유를', '추천 이유는', 500, true);
  const description = text('description', '책 소개를', '책 소개는', 2000, false);
  if (typeof source.categoryId !== 'number' || !Number.isSafeInteger(source.categoryId) || source.categoryId < 1 || source.categoryId > 2147483647) {
    fieldErrors.categoryId = '분야를 선택해 주세요.';
  }
  if (Object.keys(fieldErrors).length) {
    throw new BadRequestException({ message: '입력한 내용을 확인해 주세요.', fieldErrors });
  }
  return { categoryId: source.categoryId as number, title, author, recommendation, description };
}

export function parseBookId(value: string): number {
  if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) {
    throw new BadRequestException({ message: '책 번호가 올바르지 않습니다.' });
  }
  return Number(value);
}
