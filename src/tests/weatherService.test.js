const weatherService = require('../../server/services/weatherService');

const archiveHour = () => ({
  ok: true,
  json: async () => ({
    hourly: {
      time: Array.from(
        { length: 24 },
        (_, hour) => `2021-07-27T${String(hour).padStart(2, '0')}:00`
      ),
      weather_code: Array.from({ length: 24 }, (_, hour) => (hour === 14 ? 53 : 1)),
    },
  }),
});

describe('weatherService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('maps the Costa Rica 14:12 archive hour to rain', async () => {
    global.fetch.mockResolvedValue(archiveHour());
    await expect(
      weatherService.lookup({ lat: 9.93, lng: -84.09, date: '2021-07-27', time: '14:12' })
    ).resolves.toBe('rain');
    expect(global.fetch.mock.calls[0][0]).toContain('archive-api.open-meteo.com');
    expect(global.fetch.mock.calls[0][0]).toContain('hourly=weather_code');
  });

  test('uses the daily code when only a date is set', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: ['2021-07-27'], weather_code: [3] } }),
    });
    await expect(
      weatherService.lookup({ lat: 9.93, lng: -84.09, date: '2021-07-27' })
    ).resolves.toBe('cloudy');
    expect(global.fetch.mock.calls[0][0]).toContain('daily=weather_code');
  });

  test('returns null when the lookup fails', async () => {
    global.fetch.mockRejectedValue(new Error('offline'));
    await expect(
      weatherService.lookup({ lat: 9.93, lng: -84.09, date: '2021-07-27', time: '14:12' })
    ).resolves.toBeNull();
  });
});
