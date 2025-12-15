// import { Module } from '@nestjs/common';
// import {
//   ConfigService,
//   ConfigModule as NestConfigModule,
// } from '@nestjs/config';
// import * as Joi from 'joi';

// @Module({
//   imports: [
//     NestConfigModule.forRoot({
//       isGlobal: true,
//       cache: true,
//       validationSchema: Joi.object({
//         DATABASE_URL: Joi.string().required(),
//         PORT: Joi.string().required(),
//         JWT_SECRET: Joi.string().required(),
//         SWAGGER_DOC_TITLE: Joi.string().required(),
//         SWAGGER_DOC_DESCRIPTION: Joi.string().required(),
//         SWAGGER_DOC_VERSION: Joi.string().required(),
//         SWAGGER_PATH: Joi.string().required(),
//         SWAGGER_SITE_TITLE: Joi.string().required(),
//         SWAGGER_MODELS_EXPAND_DEPTH: Joi.number().required(),
//         NODE_ENV: Joi.string()
//           .valid('production', 'development', 'test')
//           .default('development'),
//       }),
//     }),
//   ],
//   providers: [ConfigService],
//   exports: [ConfigService],
// })
// export class ConfigModule {}
