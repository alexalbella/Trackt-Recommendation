export class TraktProvider {
  constructor(private readonly config: { clientId: string; redirectUri: string }) {}

  getAuthorizationUrl(state: string) {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state
    });

    return `https://trakt.tv/oauth/authorize?${params.toString()}`;
  }

  async syncIncremental(userId: string) {
    return {
      userId,
      resources: ["ratings", "history", "watchlist", "lists"],
      mode: "incremental",
      syncedAt: new Date().toISOString()
    };
  }
}
