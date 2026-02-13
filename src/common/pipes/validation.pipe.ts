import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  constructor(private readonly i18n: I18nService) {}

  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype as new () => unknown, value, {
      enableImplicitConversion: true,
    });
    const errors = await validate(object as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = await Promise.all(
        errors.map(async (error) => {
          const constraints = error.constraints || {};
          const constraintKeys = Object.keys(constraints);

          // Try to get translated message for each constraint
          const translatedMessages = await Promise.all(
            constraintKeys.map(async (key) => {
              const constraintValue = constraints[key];

              // Map class-validator constraint keys to i18n keys
              const i18nKey = this.getI18nKey(key, error.property);

              try {
                // Try to translate the message
                const translated = await this.i18n.translate(i18nKey, {
                  args: {
                    property: error.property,
                    value: error.value as unknown,
                    constraints: error.constraints,
                  },
                });

                // If translation returns the key, use the original message
                return translated === i18nKey ? constraintValue : translated;
              } catch {
                // Fallback to original message if translation fails
                return constraintValue;
              }
            }),
          );

          return translatedMessages.join(', ');
        }),
      );

      throw new BadRequestException(messages);
    }

    return object;
  }

  private getI18nKey(constraintKey: string, property: string): string {
    // Map class-validator constraint keys to i18n translation keys
    const keyMap: Record<string, string> = {
      isNotEmpty: 'validation.required',
      isEmail: 'validation.isEmail',
      isString: 'validation.isString',
      minLength: 'validation.minLength',
      maxLength: 'validation.maxLength',
      matches: property === 'password' ? 'validation.password.pattern' : 'validation.matches',
    };

    return keyMap[constraintKey] || `validation.${constraintKey}`;
  }

  private toValidate(metatype: unknown): boolean {
    const types: unknown[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
