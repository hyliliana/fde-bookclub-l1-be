import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { BookInput } from './book-input.js';

const columns = `b.id, b.category_id AS "categoryId", c.name AS "categoryName",
  b.title, b.author, b.description, b.recommendation, b.created_at AS "createdAt"`;

@Injectable()
export class BooksService {
  constructor(private readonly db: DatabaseService) {}

  async categories() {
    const result = await this.db.query('SELECT id, name FROM bookclub_l1.categories ORDER BY id');
    return result.rows;
  }

  async list() {
    const result = await this.db.query(`SELECT ${columns} FROM bookclub_l1.books b
      JOIN bookclub_l1.categories c ON c.id = b.category_id ORDER BY b.created_at DESC, b.id DESC`);
    return result.rows;
  }

  async detail(id: number) {
    const result = await this.db.query(`SELECT ${columns} FROM bookclub_l1.books b
      JOIN bookclub_l1.categories c ON c.id = b.category_id WHERE b.id = $1`, [id]);
    if (!result.rows[0]) throw new NotFoundException({ message: '책을 찾을 수 없습니다. 목록에서 다시 선택해 주세요.' });
    return result.rows[0];
  }

  async create(input: BookInput) {
    const result = await this.db.query(`WITH inserted AS (
      INSERT INTO bookclub_l1.books (category_id, title, author, description, recommendation)
      SELECT id, $2, $3, $4, $5 FROM bookclub_l1.categories WHERE id = $1
      RETURNING *
    ) SELECT ${columns} FROM inserted b JOIN bookclub_l1.categories c ON c.id = b.category_id`,
    [input.categoryId, input.title, input.author, input.description, input.recommendation]);
    if (!result.rows[0]) {
      throw new BadRequestException({ message: '분야를 다시 선택해 주세요.', fieldErrors: { categoryId: '등록된 분야를 선택해 주세요.' } });
    }
    return result.rows[0];
  }
}
