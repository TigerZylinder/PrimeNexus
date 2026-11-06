using SerienStreamAPI.Client;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:4317");

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "PrimeNexus SerienStream metadata bridge",
    playbackResolution = false
}));

app.MapGet("/catalog", async (string title, string? site, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(title) || title.Length > 160)
        return Results.BadRequest(new { error = "Bitte einen Serientitel (maximal 160 Zeichen) angeben." });

    var normalizedSite = (site ?? "serie").Trim().ToLowerInvariant();
    if (normalizedSite is not ("serie" or "anime"))
        return Results.BadRequest(new { error = "site muss 'serie' oder 'anime' sein." });

    var hostUrl = normalizedSite == "anime" ? "https://aniworld.to/" : "https://s.to/";
    var client = new SerienStreamClient(hostUrl, normalizedSite, ignoreCertificateValidation: false);

    try
    {
        var series = await client.GetSeriesAsync(title.Trim(), cancellationToken);
        var episodes = new List<object>();

        // Only collect episode catalogue metadata. Hoster pages and playback URLs
        // are deliberately not requested or resolved by this bridge.
        for (var season = 1; season <= series.SeasonsCount; season++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                var seasonEpisodes = await client.GetEpisodesAsync(title.Trim(), season, cancellationToken);
                foreach (var episode in seasonEpisodes)
                {
                    episodes.Add(new
                    {
                        id = $"{normalizedSite}-{title.Trim()}-s{season}-e{episode.Number}",
                        season,
                        episode = episode.Number,
                        title_de = string.IsNullOrWhiteSpace(episode.Title) ? $"Episode {episode.Number}" : episode.Title,
                        title_hu = string.IsNullOrWhiteSpace(episode.Title) ? $"Epizód {episode.Number}" : episode.Title,
                        description_de = "",
                        description_hu = "",
                        metadataOnly = true
                    });
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                // A missing or temporarily unavailable season should not hide
                // metadata already obtained for the rest of the series.
            }
        }

        var catalogItem = new
        {
            id = $"{normalizedSite}-{title.Trim()}",
            type = "series",
            title_de = series.Title,
            title_hu = series.Title,
            description_de = series.Description,
            description_hu = series.Description,
            poster = series.BannerUrl,
            year = series.YearStart.ToString(),
            category = normalizedSite == "anime" ? "animation" : "series",
            language = "de",
            episodes,
            metadataOnly = true
        };

        return Results.Ok(new { items = new[] { catalogItem } });
    }
    catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
    {
        return Results.Problem("Die Anfrage wurde abgebrochen.", statusCode: 408);
    }
    catch (Exception exception)
    {
        return Results.Problem(
            title: "Serien-Metadaten konnten nicht geladen werden.",
            detail: exception.Message,
            statusCode: 502);
    }
});

app.Run();
