jest.mock('../../server/services/weatherService', () => ({
  lookup: jest.fn(),
}));

const weatherService = require('../../server/services/weatherService');
const weatherRoutes = require('../../server/routes/weather');

const handler = () => {
  const router = weatherRoutes();
  const layer = router.stack.find((item) => item.route && item.route.path === '/');
  return layer.route.stack[0].handle;
};

const mockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
};

describe('GET /api/weather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requires an authenticated researcher', async () => {
    const res = mockRes();
    await handler()({ isAuthenticated: () => false, query: {} }, res, jest.fn());
    expect(res.statusCode).toBe(401);
    expect(weatherService.lookup).not.toHaveBeenCalled();
  });

  test('returns the chip from the lookup', async () => {
    weatherService.lookup.mockResolvedValue('rain');
    const res = mockRes();
    await handler()(
      {
        isAuthenticated: () => true,
        query: { lat: '9.93', lng: '-84.09', date: '2021-07-27', time: '14:12' },
      },
      res,
      jest.fn()
    );
    expect(res.body).toEqual({ weather: 'rain' });
    expect(weatherService.lookup).toHaveBeenCalledWith({
      lat: '9.93',
      lng: '-84.09',
      date: '2021-07-27',
      time: '14:12',
    });
  });
});