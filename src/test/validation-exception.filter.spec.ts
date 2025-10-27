import { ValidationExceptionFilter } from '../common/filters/validation-exception.filter';
import { BadRequestException, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ValidationExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-endpoint',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  describe('catch', () => {
    it('should be defined', () => {
      expect(filter).toBeDefined();
    });

    it('should handle validation errors with constraints', () => {
      const validationErrors = [
        {
          property: 'email',
          value: 'invalid-email',
          constraints: {
            isEmail: 'email must be an email',
          },
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 422,
          error: 'Validation Failed',
          message: 'Los datos enviados contienen errores de validación',
          path: '/test-endpoint',
          errors: [
            {
              field: 'email',
              message: 'email must be an email',
              value: 'invalid-email',
              constraint: 'isEmail',
            },
          ],
        }),
      );
    });

    it('should handle multiple validation errors', () => {
      const validationErrors = [
        {
          property: 'email',
          value: 'invalid',
          constraints: {
            isEmail: 'email must be an email',
          },
        },
        {
          property: 'password',
          value: '123',
          constraints: {
            minLength: 'password must be at least 8 characters',
            isStrongPassword: 'password is not strong enough',
          },
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 422,
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password', constraint: 'minLength' }),
            expect.objectContaining({ field: 'password', constraint: 'isStrongPassword' }),
          ]),
        }),
      );
    });

    it('should handle nested validation errors (one level)', () => {
      const validationErrors = [
        {
          property: 'address',
          value: {},
          children: [
            {
              property: 'street',
              value: '',
              constraints: {
                isNotEmpty: 'street should not be empty',
              },
            },
          ],
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 422,
          errors: [
            {
              field: 'address.street',
              message: 'street should not be empty',
              value: '',
              constraint: 'isNotEmpty',
            },
          ],
        }),
      );
    });

    it('should handle deeply nested validation errors (multiple levels)', () => {
      const validationErrors = [
        {
          property: 'user',
          value: {},
          children: [
            {
              property: 'profile',
              value: {},
              children: [
                {
                  property: 'name',
                  value: '',
                  constraints: {
                    isNotEmpty: 'name should not be empty',
                  },
                },
              ],
            },
          ],
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [
            {
              field: 'user.profile.name',
              message: 'name should not be empty',
              value: '',
              constraint: 'isNotEmpty',
            },
          ],
        }),
      );
    });

    it('should handle mixed direct and nested errors', () => {
      const validationErrors = [
        {
          property: 'email',
          value: 'invalid',
          constraints: {
            isEmail: 'email must be an email',
          },
        },
        {
          property: 'address',
          value: {},
          children: [
            {
              property: 'city',
              value: '',
              constraints: {
                isNotEmpty: 'city should not be empty',
              },
            },
          ],
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'address.city' }),
          ]),
        }),
      );
    });

    it('should handle errors with no constraints (edge case)', () => {
      const validationErrors = [
        {
          property: 'field',
          value: 'value',
          // No constraints property
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [],
        }),
      );
    });

    it('should include timestamp in response', () => {
      const validationErrors = [
        {
          property: 'field',
          value: 'value',
          constraints: {
            test: 'test error',
          },
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.timestamp).toBeDefined();
      expect(typeof responseCall.timestamp).toBe('string');
      expect(new Date(responseCall.timestamp).getTime()).not.toBeNaN();
    });

    it('should handle non-validation BadRequestException (string message)', () => {
      const exception = new BadRequestException('Simple error message');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Simple error message',
        }),
      );
    });

    it('should handle non-validation BadRequestException (object without array message)', () => {
      const exceptionResponse = {
        statusCode: 400,
        message: 'Not an array',
        error: 'Bad Request',
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(exceptionResponse);
    });

    it('should preserve request URL in response', () => {
      mockRequest.url = '/api/v1/users/create';

      const validationErrors = [
        {
          property: 'name',
          value: '',
          constraints: {
            isNotEmpty: 'name should not be empty',
          },
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.path).toBe('/api/v1/users/create');
    });

    it('should handle empty validation errors array', () => {
      const exception = new BadRequestException({
        message: [],
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [],
        }),
      );
    });

    it('should handle error with multiple constraints on same field', () => {
      const validationErrors = [
        {
          property: 'username',
          value: 'ab',
          constraints: {
            minLength: 'username must be at least 3 characters',
            maxLength: 'username must be at most 20 characters',
            matches: 'username must contain only letters and numbers',
          },
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.errors).toHaveLength(3);
      expect(responseCall.errors.every((e: any) => e.field === 'username')).toBe(true);
    });

    it('should handle nested children without constraints', () => {
      const validationErrors = [
        {
          property: 'parent',
          value: {},
          children: [
            {
              property: 'child',
              value: 'value',
              // No constraints
            },
          ],
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [],
        }),
      );
    });

    it('should format complex nested structure correctly', () => {
      const validationErrors = [
        {
          property: 'order',
          value: {},
          children: [
            {
              property: 'items',
              value: {},
              children: [
                {
                  property: 'product',
                  value: {},
                  children: [
                    {
                      property: 'name',
                      value: '',
                      constraints: {
                        isNotEmpty: 'product name is required',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const exception = new BadRequestException({
        message: validationErrors,
      });

      filter.catch(exception, mockArgumentsHost);

      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.errors[0].field).toBe('order.items.product.name');
    });
  });
});
