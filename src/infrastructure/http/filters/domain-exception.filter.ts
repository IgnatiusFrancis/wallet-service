import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  WalletNotFoundException,
  InsufficientFundsException,
} from '@domain/exceptions/domain.exceptions';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    if (exception instanceof WalletNotFoundException) {
      status = HttpStatus.NOT_FOUND;
    } else if (exception instanceof InsufficientFundsException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
}
