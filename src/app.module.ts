import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { BooksService } from './books.service.js';
import { DatabaseService } from './database.service.js';

@Module({ controllers: [AppController], providers: [BooksService, DatabaseService] })
export class AppModule {}
