import { Body, Controller, Get, Param, Post, ServiceUnavailableException } from '@nestjs/common';
import { BooksService } from './books.service.js';
import { DatabaseService } from './database.service.js';
import { parseBookId, validateBookInput } from './book-input.js';

@Controller()
export class AppController {
  constructor(private readonly books: BooksService, private readonly db: DatabaseService) {}

  @Get('categories') categories() { return this.books.categories(); }
  @Get('books') list() { return this.books.list(); }
  @Get('books/:id') detail(@Param('id') id: string) { return this.books.detail(parseBookId(id)); }
  @Post('books') create(@Body() input: unknown) { return this.books.create(validateBookInput(input)); }

  @Get('health') async health() {
    try {
      await this.db.query('SELECT 1 AS connected');
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'disconnected' });
    }
  }
}
