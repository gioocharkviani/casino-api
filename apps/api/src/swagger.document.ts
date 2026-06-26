import type { OpenAPIObject } from '@nestjs/swagger';

export const swaggerDocument: Omit<OpenAPIObject, 'paths'> & {
  paths: Record<string, any>;
} = {
  openapi: '3.0.0',
  info: {
    title: 'Casino API',
    description: 'Full Casino API documentation',
    version: '1.0.0',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // ── USER ─────────────────────────────────────────────────────
      SignUpRequest: {
        type: 'object',
        required: ['phone', 'userName', 'password', 'email', 'firstName', 'lastName', 'country', 'birthDay'],
        properties: {
          phone: { type: 'string', example: '+1234567890' },
          userName: { type: 'string', example: 'johndoe', minLength: 3, maxLength: 20 },
          password: { type: 'string', example: 'pass123', minLength: 6 },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          country: { type: 'string', example: 'GE' },
          birthDay: { type: 'string', format: 'date', example: '1990-01-15' },
          personalId: { type: 'string', example: 'AA123456789', description: 'Passport / national ID number' },
        },
      },
      SignInRequest: {
        type: 'object',
        required: ['userName', 'password'],
        properties: {
          userName: { type: 'string', example: 'johndoe' },
          password: { type: 'string', example: 'pass123' },
        },
      },
      VerifyRequest: {
        type: 'object',
        properties: {
          otp: { type: 'string', example: '123456' },
        },
      },
      ChangeUserInfoRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'new@example.com' },
          phone: { type: 'number', example: 555000111 },
          oldPassword: { type: 'string', example: 'old123' },
          newPassword: { type: 'string', example: 'new456' },
          birthDay: { type: 'string', format: 'date', example: '1990-01-15' },
        },
      },

      // ── WALLET ───────────────────────────────────────────────────
      DepositRequest: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', example: 100 },
          cardNumber: { type: 'string', example: '4111111111111111' },
          cardholderName: { type: 'string', example: 'John Doe' },
          cardExpMonth: { type: 'integer', example: 12 },
          cardExpYear: { type: 'integer', example: 2027 },
          cvv: { type: 'string', example: '123' },
        },
      },
      WithdrawalRequest: {
        type: 'object',
        required: ['amount', 'iban'],
        properties: {
          amount: { type: 'number', example: 50 },
          iban: { type: 'string', example: 'GE29NB0000000101904917' },
        },
      },

      // ── PROMOTIONS (user) ─────────────────────────────────────────
      ActivateBonusRequest: {
        type: 'object',
        required: ['userPromotionId'],
        properties: {
          userPromotionId: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
        },
      },
      RedeemCodeRequest: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', example: 'SUMMER2024' },
        },
      },

      // ── ADMIN AUTH ────────────────────────────────────────────────
      AdminSignInRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'superadmin' },
          password: { type: 'string', example: 'password123' },
        },
      },
      CreateAdminRequest: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', example: 'newadmin', minLength: 3 },
          email: { type: 'string', format: 'email', example: 'admin@casino.com' },
          password: { type: 'string', example: 'securepass', minLength: 8 },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Smith' },
          role: { type: 'string', enum: ['super_admin', 'admin', 'moderator'], example: 'admin' },
        },
      },
      UpdateAdminRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'updated@casino.com' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Smith' },
          role: { type: 'string', enum: ['super_admin', 'admin', 'moderator'] },
          newPassword: { type: 'string', example: 'newpass123', minLength: 8 },
        },
      },

      // ── ADMIN USER MANAGEMENT ─────────────────────────────────────
      BlockUserRequest: {
        type: 'object',
        properties: {
          reason: { type: 'string', example: 'Fraud suspected' },
        },
      },
      AdjustBalanceRequest: {
        type: 'object',
        required: ['amount', 'type', 'reason'],
        properties: {
          amount: { type: 'number', example: 5000 },
          type: { type: 'string', enum: ['credit', 'debit'], example: 'credit' },
          reason: { type: 'string', example: 'Manual compensation' },
        },
      },
      SetPersonalIdRequest: {
        type: 'object',
        required: ['personalId'],
        properties: {
          personalId: { type: 'string', example: 'AA123456789' },
        },
      },

      // ── ADMIN PROMOTIONS ──────────────────────────────────────────
      CreatePromotionRequest: {
        type: 'object',
        required: ['name', 'type', 'rewardType', 'rewardValue', 'wageringMultiplier'],
        properties: {
          name: { type: 'string', example: 'Welcome Bonus 100%' },
          description: { type: 'string', example: 'First deposit match' },
          type: {
            type: 'string',
            enum: ['welcome', 'no_deposit', 'free_spins', 'reload', 'cashback', 'high_roller', 'loyalty', 'tournament', 'birthday', 'referral', 'no_wager'],
            example: 'welcome',
          },
          rewardType: {
            type: 'string',
            enum: ['bonus_balance', 'real_balance', 'free_spins'],
            example: 'bonus_balance',
          },
          rewardValue: {
            type: 'object',
            properties: {
              percentage: { type: 'number', example: 100 },
              fixedAmount: { type: 'integer', example: 0 },
              maxAmount: { type: 'integer', example: 500 },
              freeSpins: { type: 'integer', example: 0 },
            },
          },
          wageringMultiplier: { type: 'integer', minimum: 0, maximum: 100, example: 35 },
          triggerCondition: {
            type: 'object',
            properties: {
              minDeposit: { type: 'integer', example: 10 },
              lossThreshold: { type: 'integer', example: 0 },
              promoCode: { type: 'string', example: 'WELCOME' },
              eventType: { type: 'string', enum: ['deposit', 'registration', 'birthday'], example: 'deposit' },
            },
          },
          targetAudience: {
            type: 'object',
            properties: {
              countries: { type: 'array', items: { type: 'string' }, example: ['GE', 'US'] },
              vipLevels: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
              minDepositCount: { type: 'integer', example: 0 },
            },
          },
          maxWithdrawal: { type: 'integer', example: 1000 },
          maxUsagePerUser: { type: 'integer', example: 1 },
          validityHours: { type: 'integer', example: 168 },
          startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
          endDate: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59Z' },
        },
      },
      AssignPromotionRequest: {
        type: 'object',
        required: ['promotionId', 'userId'],
        properties: {
          promotionId: { type: 'string', format: 'uuid', example: 'uuid-of-promotion' },
          userId: { type: 'string', format: 'uuid', example: 'uuid-of-user' },
          overrideAmount: { type: 'integer', example: 200 },
        },
      },

      // ── ADMIN GAMES ───────────────────────────────────────────────
      AddGameCategoryRequest: {
        type: 'object',
        required: ['category'],
        properties: {
          category: { type: 'string', enum: ['TOP', 'NEW'], example: 'TOP' },
        },
      },

      // ── GENERIC RESPONSES ─────────────────────────────────────────
      SuccessResponse: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: 200 },
          data: { type: 'object' },
          message: { type: 'string', example: 'Success' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Error description' },
        },
      },
    },
  },
  paths: {
    // ════════════════════════════════════════════════════════════════
    // USER
    // ════════════════════════════════════════════════════════════════
    '/api/user/sign-up': {
      post: {
        tags: ['User'],
        summary: 'Register a new user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SignUpRequest' } } } },
        responses: {
          201: { description: 'User registered' },
          400: { description: 'email / userName / phone / personalId already exists' },
        },
      },
    },
    '/api/user/sign-in': {
      post: {
        tags: ['User'],
        summary: 'Sign in — returns Bearer token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SignInRequest' } } } },
        responses: {
          200: { description: 'Returns { token }' },
          401: { description: 'Invalid credentials' },
          403: { description: 'Account is blocked' },
        },
      },
    },
    '/api/user/sign-out': {
      post: {
        tags: ['User'],
        summary: 'Sign out — invalidates token',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Signed out' } },
      },
    },
    '/api/user/user': {
      get: {
        tags: ['User'],
        summary: 'Get current user info',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User object' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/api/user/verify': {
      post: {
        tags: ['User'],
        summary: 'Verify account with OTP from email',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyRequest' } } } },
        responses: { 200: { description: 'Account verified' } },
      },
    },
    '/api/user/change': {
      post: {
        tags: ['User'],
        summary: 'Update user profile (email, phone, password, birthday)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangeUserInfoRequest' } } } },
        responses: { 201: { description: 'Profile updated' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // WALLET
    // ════════════════════════════════════════════════════════════════
    '/api/wallet/deposit': {
      post: {
        tags: ['Wallet'],
        summary: 'Deposit funds (card payment)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DepositRequest' } } } },
        responses: { 200: { description: 'Deposit successful' } },
      },
    },
    '/api/wallet/withdrawal': {
      post: {
        tags: ['Wallet'],
        summary: 'Withdraw funds to IBAN',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WithdrawalRequest' } } } },
        responses: { 200: { description: 'Withdrawal initiated' } },
      },
    },
    '/api/wallet/user-transactions': {
      get: {
        tags: ['Wallet'],
        summary: 'Get current user transaction history',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of transactions' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // GAME
    // ════════════════════════════════════════════════════════════════
    '/api/game': {
      get: {
        tags: ['Game'],
        summary: 'Get all active games (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', example: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string', example: 'starburst' } },
          { name: 'provider', in: 'query', schema: { type: 'string', example: 'NetEnt' } },
        ],
        responses: { 200: { description: 'Paginated game list' } },
      },
    },
    '/api/game/provider': {
      get: {
        tags: ['Game'],
        summary: 'Get all game providers',
        responses: { 200: { description: 'List of providers' } },
      },
    },
    '/api/game/categories': {
      get: {
        tags: ['Game'],
        summary: 'Get games grouped by category (TOP, NEW)',
        responses: { 200: { description: 'Games by category' } },
      },
    },
    '/api/game/favorite': {
      get: {
        tags: ['Game'],
        summary: 'Get current user favorite games',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Favorite games list' } },
      },
    },
    '/api/game/toggle-favorite': {
      post: {
        tags: ['Game'],
        summary: 'Add or remove a game from favorites',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { gameId: { type: 'string', example: 'abc-uuid-game-id' } } } } },
        },
        responses: { 201: { description: 'Toggled' } },
      },
    },
    '/api/game/lunch-game': {
      get: {
        tags: ['Game'],
        summary: 'Launch a game session (user must be verified)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'gameId', in: 'query', required: true, schema: { type: 'string', example: 'abc-uuid-game-id' } },
        ],
        responses: { 200: { description: 'Game launch URL / session' }, 403: { description: 'Not verified' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // PROMOTIONS (user)
    // ════════════════════════════════════════════════════════════════
    '/api/promotions/my-bonuses': {
      get: {
        tags: ['Promotions'],
        summary: "Get current user's bonuses",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of user bonuses' } },
      },
    },
    '/api/promotions/activate': {
      post: {
        tags: ['Promotions'],
        summary: 'Activate an assigned bonus',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ActivateBonusRequest' } } } },
        responses: { 200: { description: 'Bonus activated' } },
      },
    },
    '/api/promotions/redeem': {
      post: {
        tags: ['Promotions'],
        summary: 'Redeem a promo code',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RedeemCodeRequest' } } } },
        responses: { 200: { description: 'Code redeemed' }, 404: { description: 'Invalid code' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // NOTIFICATION
    // ════════════════════════════════════════════════════════════════
    '/api/notification/verify-user': {
      post: {
        tags: ['Notification'],
        summary: 'Send verification email',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email', example: 'john@example.com' } } } } },
        },
        responses: { 201: { description: 'Email sent' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // ADMIN — AUTH
    // ════════════════════════════════════════════════════════════════
    '/api/admin/sign-in': {
      post: {
        tags: ['Admin / Auth'],
        summary: 'Admin sign in — returns Bearer token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminSignInRequest' } } } },
        responses: { 200: { description: 'Returns { token }' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/admin/sign-out': {
      post: {
        tags: ['Admin / Auth'],
        summary: 'Admin sign out',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Signed out' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // ADMIN — ADMIN MANAGEMENT  (super_admin only)
    // ════════════════════════════════════════════════════════════════
    '/api/admin/admins': {
      get: {
        tags: ['Admin / Admin Management'],
        summary: 'List all admins  [super_admin]',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Admin list' } },
      },
      post: {
        tags: ['Admin / Admin Management'],
        summary: 'Create a new admin account  [super_admin]',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } } } },
        responses: { 200: { description: 'Admin created' }, 409: { description: 'Username or email already in use' } },
      },
    },
    '/api/admin/admins/{id}': {
      put: {
        tags: ['Admin / Admin Management'],
        summary: 'Update admin account  [super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAdminRequest' } } } },
        responses: { 200: { description: 'Admin updated' } },
      },
      delete: {
        tags: ['Admin / Admin Management'],
        summary: 'Deactivate admin account  [super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Admin deactivated' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // ADMIN — USER MANAGEMENT
    // ════════════════════════════════════════════════════════════════
    '/api/admin/users': {
      get: {
        tags: ['Admin / Users'],
        summary: 'List all users  [any admin]',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User list' } },
      },
    },
    '/api/admin/users/{userId}': {
      get: {
        tags: ['Admin / Users'],
        summary: 'Get single user by ID  [any admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User object' }, 404: { description: 'Not found' } },
      },
    },
    '/api/admin/users/{userId}/block': {
      put: {
        tags: ['Admin / Users'],
        summary: 'Block user — invalidates all sessions  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: false, content: { 'application/json': { schema: { $ref: '#/components/schemas/BlockUserRequest' } } } },
        responses: { 200: { description: 'User blocked' } },
      },
    },
    '/api/admin/users/{userId}/unblock': {
      put: {
        tags: ['Admin / Users'],
        summary: 'Unblock user  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User unblocked' } },
      },
    },
    '/api/admin/users/{userId}/activate': {
      put: {
        tags: ['Admin / Users'],
        summary: 'Force-verify user (skip OTP)  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User activated' } },
      },
    },
    '/api/admin/users/{userId}/personal-id': {
      put: {
        tags: ['Admin / Users'],
        summary: 'Set / update passport personal ID  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SetPersonalIdRequest' } } } },
        responses: { 200: { description: 'Personal ID updated' }, 409: { description: 'Already assigned to another user' } },
      },
    },
    '/api/admin/users/{userId}/transactions': {
      get: {
        tags: ['Admin / Users'],
        summary: "Get user's transaction history  [any admin]",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', example: 100 } },
        ],
        responses: { 200: { description: 'Transaction list' } },
      },
    },
    '/api/admin/users/{userId}/balance': {
      post: {
        tags: ['Admin / Users'],
        summary: 'Manually credit or debit user balance  [super_admin only]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AdjustBalanceRequest' } } } },
        responses: { 200: { description: 'Balance adjusted' } },
      },
    },
    '/api/admin/users/{userId}/bonuses': {
      get: {
        tags: ['Admin / Users'],
        summary: "Get user's bonuses  [any admin]",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Bonus list' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // ADMIN — PROMOTIONS
    // ════════════════════════════════════════════════════════════════
    '/api/admin/promotions': {
      get: {
        tags: ['Admin / Promotions'],
        summary: 'List all promotions  [any admin]',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Promotion list' } },
      },
      post: {
        tags: ['Admin / Promotions'],
        summary: 'Create promotion  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePromotionRequest' } } } },
        responses: { 201: { description: 'Promotion created' } },
      },
    },
    '/api/admin/promotions/{id}': {
      get: {
        tags: ['Admin / Promotions'],
        summary: 'Get single promotion  [any admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Promotion object' } },
      },
      put: {
        tags: ['Admin / Promotions'],
        summary: 'Update promotion  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/CreatePromotionRequest' },
                  { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'active', 'paused', 'archived'] } } },
                ],
              },
            },
          },
        },
        responses: { 200: { description: 'Promotion updated' } },
      },
      delete: {
        tags: ['Admin / Promotions'],
        summary: 'Delete promotion  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/api/admin/promotions/assign': {
      post: {
        tags: ['Admin / Promotions'],
        summary: 'Manually assign promotion to a user  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignPromotionRequest' } } } },
        responses: { 200: { description: 'Promotion assigned' } },
      },
    },
    '/api/admin/bonuses/{userPromotionId}': {
      delete: {
        tags: ['Admin / Promotions'],
        summary: "Cancel a user's active bonus  [admin, super_admin]",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userPromotionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Bonus cancelled' } },
      },
    },
    '/api/admin/audit': {
      get: {
        tags: ['Admin / Promotions'],
        summary: 'Get promotion audit log  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'promotionId', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Audit log entries' } },
      },
    },

    // ════════════════════════════════════════════════════════════════
    // ADMIN — GAMES
    // ════════════════════════════════════════════════════════════════
    '/api/admin/games': {
      get: {
        tags: ['Admin / Games'],
        summary: 'Get all games including hidden ones  [any admin]',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', example: 50 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'provider', in: 'query', schema: { type: 'string' } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['TOP', 'NEW'] } },
        ],
        responses: { 200: { description: 'Paginated game list' } },
      },
    },
    '/api/admin/games/{id}/show': {
      put: {
        tags: ['Admin / Games'],
        summary: 'Make game visible to players  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Game visible' } },
      },
    },
    '/api/admin/games/{id}/hide': {
      put: {
        tags: ['Admin / Games'],
        summary: 'Hide game from players  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Game hidden' } },
      },
    },
    '/api/admin/games/{id}/category': {
      post: {
        tags: ['Admin / Games'],
        summary: 'Add game to TOP or NEW category  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AddGameCategoryRequest' } } } },
        responses: { 201: { description: 'Category added' }, 200: { description: 'Already in category' } },
      },
    },
    '/api/admin/games/{id}/category/{category}': {
      delete: {
        tags: ['Admin / Games'],
        summary: 'Remove game from a category  [admin, super_admin]',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'category', in: 'path', required: true, schema: { type: 'string', enum: ['TOP', 'NEW'] } },
        ],
        responses: { 200: { description: 'Removed' }, 404: { description: 'Not in category' } },
      },
    },
    '/api/admin/games/{id}/categories': {
      get: {
        tags: ['Admin / Games'],
        summary: 'Get categories assigned to a game  [any admin]',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Array of category strings e.g. ["TOP"]' } },
      },
    },
  },
};
