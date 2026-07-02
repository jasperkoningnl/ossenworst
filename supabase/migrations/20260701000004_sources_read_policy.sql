-- Sources moeten leesbaar zijn voor de frontend omdat topic_items en raw_items
-- een FK-join naar sources doen (o.a. voor bronnaam en tier in de tijdlijn).
-- Zonder deze policy retourneert de join null voor niet-service-role clients.
create policy "sources zijn publiek leesbaar" on sources for select using (true);
