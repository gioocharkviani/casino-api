//VALIDATE USER SESSION
  async validateUserSession(token?: string) {
    if (!token) return { valid: false };

    const session = await this.userSessionRepository.findOne({
      where: { token: token },
    });

    if (!session || !session.token) {
      return { valid: false };
    }
    if (session.expiresAt < new Date()) {
      session.token = null;
      await this.userSessionRepository.save(session);
      return { valid: false };
    }
    const expireHours = parseInt(
      this.configService.get('AUTH_TOKEN_EXPIRE_TIME') || '24',
      10,
    );
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + expireHours);

    session.expiresAt = newExpiry;
    await this.userSessionRepository.save(session);
    return {
      valid: true,
      userId: session.userId,
    };
  }
  //VALIDATE USER SESSION